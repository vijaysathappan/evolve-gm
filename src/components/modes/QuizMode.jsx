import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import './Modes.css';
import { LLM_API_URL } from '../../config/api';

const BOOT_MSG = {
  role: 'ai',
  text: "Hey! 👋 I'm your Evolve AI quiz tutor.\n\nJust tell me what you want to be quizzed on — subject and topic. For example:\n• \"Quiz me on Newton's Laws\"\n• \"Test my organic chemistry reactions\"\n• \"5 questions on integration for JEE\"",
};

export default function QuizMode({ userTrack }) {
  const [phase, setPhase]     = useState('chat'); // chat | quiz | score
  const [messages, setMessages] = useState([BOOT_MSG]);
  const [input, setInput]     = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected]   = useState({});
  const [revealed, setRevealed]   = useState({});
  const [quizMeta, setQuizMeta]   = useState('');
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMsg = (role, text) =>
    setMessages(prev => [...prev, { role, text, id: Date.now() + Math.random() }]);

  const callLLM = async (userMsg) => {
    setIsTyping(true);
    try {
      const prompt =
`You are Evolve AI, a ${userTrack} exam quiz bot. The student said: "${userMsg}"

Your task: understand what they want to be quizzed on, then generate 5 MCQ questions.

Reply with ONLY this JSON — no markdown, no extra text:
{
  "reply": "Short friendly 1-2 sentence response confirming what you'll quiz them on",
  "ready": true,
  "subject": "Physics | Chemistry | Mathematics | Biology",
  "topic": "specific topic",
  "questions": [
    {"q": "question text", "opts": ["A text","B text","C text","D text"], "ans": 0, "exp": "explanation of correct answer"}
  ]
}

If the request is unclear or off-topic, set "ready": false, "questions": [], and ask for clarification in "reply".
Generate exactly 5 questions suitable for ${userTrack}. "ans" is the 0-based index of the correct option.`;

      const res  = await fetch(`${LLM_API_URL}/api/query`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: prompt, chat_data_id: null, user_id: null }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      let raw = (data.text || '').replace(/```json|```/gi, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      const parsed = JSON.parse(match[0]);

      setIsTyping(false);
      addMsg('ai', parsed.reply || "Let's go! Quiz is ready.");

      if (parsed.ready && parsed.questions?.length >= 3) {
        setQuizMeta(`${parsed.subject} · ${parsed.topic}`);
        setQuestions(parsed.questions);
        setSelected({});
        setRevealed({});
        // Short delay so user reads AI reply before transition
        setTimeout(() => setPhase('quiz'), 900);
      }
    } catch {
      setIsTyping(false);
      addMsg('ai', "Sorry, I had trouble with that. Could you be more specific? Try: \"Quiz me on Projectile Motion in Physics\".");
    }
  };

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isTyping) return;
    setInput('');
    addMsg('user', msg);
    callLLM(msg);
  };

  const selectAnswer = (qi, oi) => {
    if (revealed[qi]) return;
    setSelected(prev => ({ ...prev, [qi]: oi }));
    setRevealed(prev => ({ ...prev, [qi]: true }));
  };

  const score  = questions.filter((q, i) => selected[i] === q.ans).length;
  const allDone = Object.keys(revealed).length === questions.length && questions.length > 0;

  /* ── CHAT ─────────────────────────────────────── */
  if (phase === 'chat') return (
    <div className="mode-chat-wrapper">
      <div className="mode-chat-messages custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`mode-chat-row ${msg.role}`}>
            {msg.role === 'ai' && <div className="mode-chat-ava">⚡</div>}
            <div className="mode-chat-bubble">
              {msg.text.split('\n').map((l, li, arr) => (
                <span key={li}>{l}{li < arr.length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="mode-chat-row ai">
            <div className="mode-chat-ava">⚡</div>
            <div className="mode-chat-bubble mode-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mode-chat-bar">
        <textarea
          ref={inputRef}
          className="mode-chat-input"
          placeholder="e.g. Quiz me on Newton's Laws in Physics..."
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button
          className={`mode-chat-send ${input.trim() && !isTyping ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );

  /* ── QUIZ ─────────────────────────────────────── */
  if (phase === 'quiz') return (
    <div className="mode-body">
      <div className="quiz-active-header">
        <div className="quiz-active-meta">
          <h3>{quizMeta}</h3>
          <p>{Object.keys(revealed).length} / {questions.length} answered</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="quiz-btn-retry"
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            onClick={() => { setMessages([BOOT_MSG]); setPhase('chat'); }}
            title="New quiz"
          >
            <RotateCcw size={13} style={{ marginRight: 4, display:'inline' }} />New
          </button>
          {allDone && (
            <button className="quiz-see-score-btn" onClick={() => setPhase('score')}>
              See Score →
            </button>
          )}
        </div>
      </div>

      <div className="quiz-questions-list">
        {questions.map((q, qi) => {
          const isRev     = revealed[qi];
          const isCorrect = selected[qi] === q.ans;
          return (
            <div key={qi} className={`quiz-q-card ${isRev ? (isCorrect ? 'revealed-correct' : 'revealed-wrong') : ''}`}>
              <div className="quiz-q-num-badge">Question {qi + 1}</div>
              <p className="quiz-q-text">{q.q}</p>
              <div className="quiz-opts">
                {q.opts.map((opt, oi) => {
                  let cls = '';
                  if (isRev) {
                    if (oi === q.ans)          cls = 'opt-correct';
                    else if (oi === selected[qi]) cls = 'opt-wrong';
                    else                          cls = 'opt-dim';
                  }
                  return (
                    <button key={oi} className={`quiz-opt-btn ${cls}`} onClick={() => selectAnswer(qi, oi)} disabled={isRev}>
                      <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {isRev && (
                <div className="quiz-explanation">
                  {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}{q.exp}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── SCORE ────────────────────────────────────── */
  const grade = score >= Math.ceil(questions.length * 0.8) ? 'great' : score >= Math.ceil(questions.length * 0.5) ? 'ok' : 'poor';
  const label = grade === 'great' ? '🎉 Excellent!' : grade === 'ok' ? '👍 Good Effort!' : '💪 Keep Practising!';
  return (
    <div className="mode-body">
      <div className="quiz-score-screen">
        <div className={`score-donut ${grade}`}>
          <span className="score-big">{score}</span>
          <span className="score-slash">/ {questions.length}</span>
        </div>
        <p className="quiz-score-label">{label}</p>
        <p className="quiz-score-sub">You answered {score} out of {questions.length} correctly.</p>
        <div className="quiz-score-btns">
          <button className="quiz-btn-retry" onClick={() => { setSelected({}); setRevealed({}); setPhase('quiz'); }}>
            Retry Same Quiz
          </button>
          <button className="quiz-btn-new" onClick={() => { setMessages([BOOT_MSG]); setQuestions([]); setPhase('chat'); }}>
            New Topic
          </button>
        </div>
      </div>
    </div>
  );
}
