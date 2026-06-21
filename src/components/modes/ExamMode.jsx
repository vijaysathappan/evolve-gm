import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Upload, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { LLM_API_URL, NODE_API_URL } from '../../config/api';

const formatTime = (s) => {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function ExamMode({ userTrack, user }) {
  /* Phase: setup | exam | review */
  const [phase, setPhase]       = useState('setup');
  
  /* Form setup state */
  const [selectedMode, setSelectedMode] = useState(null); // 'chapter' | 'subject' | 'mock'
  const [formSubject, setFormSubject] = useState('Physics');
  const [formChapter, setFormChapter] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formQuestions, setFormQuestions] = useState(10);
  const [formTips, setFormTips] = useState('');
  const [examPrompt, setExamPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [subject, setSubject]   = useState('General');
  const [chapter, setChapter]   = useState('Mixed');
  const [examType, setExamType] = useState('Custom Test');
  const [examTokens, setExamTokens] = useState({ prompt_tokens: 0, completion_tokens: 0, total_token: 0 });

  /* Exam state */
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ]   = useState(0);
  const [answers, setAnswers]     = useState({});      // { qi: optIdx }
  const [marked, setMarked]       = useState({});      // { qi: true }
  const [images, setImages]       = useState({});      // { qi: { src, file } }
  const [seconds, setSeconds]     = useState(0);
  const [submitWarn, setSubmitWarn] = useState(false); // show warning dialog
  const imgRefs     = useRef({});                       // per-question file inputs
  const timerRef    = useRef(null);

  /* Timer */
  useEffect(() => {
    if (phase === 'exam') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  /* ── Call LLM for exam generation ── */
  const callLLM = async (promptMsg) => {
    setIsTyping(true);
    setErrorMsg('');
    try {
      const prompt =
`You are Evolve AI, a ${userTrack} exam generator. The student requested: "${promptMsg}"

Generate a personalised MCQ exam based on their request.

Reply ONLY with this exact JSON — no markdown, no extra text:
{
  "reply": "Short 1-2 sentence confirmation of what exam you're generating",
  "ready": true,
  "exam_type": "Real JEE Exam | Chapter Test | Subject Exam | Custom",
  "subject": "Main subject name (e.g. Physics)",
  "chapter": "Specific topics requested (e.g. Mechanics)",
  "questions": [
    {
      "subject": "Physics",
      "q": "question text",
      "opts": ["Option A", "Option B", "Option C", "Option D"],
      "ans": 0,
      "exp": "explanation of the correct answer"
    }
  ]
}

Rules:
Rules:
- Generate the exact number of questions requested
- "ans" is the 0-based integer index of the correct option
- ALL text values must be properly escaped. Use single quotes instead of double quotes inside strings.
- Do NOT output any reasoning or <thought> tags. Just output the JSON.
- If request is unclear, set "ready": false and ask for clarification in "reply"`;

      const res  = await fetch(`${LLM_API_URL}/api/query`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: prompt, chat_data_id: null, user_id: null }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      
      // Clean up the response text before parsing
      let raw = (data.text || '');
      // 1. Remove any <thought> or <think> reasoning blocks from the LLM
      raw = raw.replace(/<(thought|think)>[\s\S]*?<\/\1>/gi, '');
      // 2. Remove markdown json blocks
      raw = raw.replace(/```json|```/gi, '').trim();
      
      const startIndex = raw.indexOf('{');
      const endIndex = raw.lastIndexOf('}');
      if (startIndex === -1 || endIndex === -1) {
        throw new Error(`No JSON found in LLM response: ${data.text}`);
      }
      
      raw = raw.substring(startIndex, endIndex + 1);
      
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        throw new Error(`${parseError.message}. Cleaned string: ${raw}`);
      }

      if (parsed.ready && parsed.questions?.length >= 3) {
        setQuestions(parsed.questions);
        setSubject(parsed.subject || 'General');
        setChapter(parsed.chapter || 'Mixed');
        setExamType(parsed.exam_type || 'Custom Test');
        if (data.usage) {
          setExamTokens(data.usage);
        } else {
          setExamTokens({ prompt_tokens: 0, completion_tokens: 0, total_token: 0 });
        }
        
        // Setup initial blank answers and marked state
        setAnswers({});
        setImages({});
        setMarked({});
        setSeconds(0);
        setCurrentQ(0);
        setTimeout(() => {
          setIsTyping(false);
          setPhase('exam');
        }, 800);
      } else {
        throw new Error(`LLM generated invalid format: missing questions. Raw response: ${JSON.stringify(parsed)}`);
      }
    } catch (e) {
      setIsTyping(false);
      console.error('LLM Fetch/Parsing Error:', e);
      setErrorMsg(e.message);
    }
  };

  const handleGenerateExam = () => {
    let promptMsg = '';
    if (selectedMode === 'chapter') {
      promptMsg = `I want a Chapter Test on ${formSubject} - ${formChapter}. Difficulty: ${formDifficulty}. Number of questions: ${formQuestions}.`;
    } else if (selectedMode === 'subject') {
      promptMsg = `Generate a ${formSubject} Subject Exam. Difficulty: ${formDifficulty}. Number of questions: ${formQuestions}.`;
    } else if (selectedMode === 'mock') {
      promptMsg = `Give me a full Real JEE Mock Exam (Physics, Chemistry, Maths). Difficulty: ${formDifficulty}. Number of questions: ${formQuestions}.`;
    }
    
    if (formTips.trim()) {
      promptMsg += ` Additional instructions/focus areas: ${formTips.trim()}`;
    }

    setExamPrompt(promptMsg);
    callLLM(promptMsg);
  };

  /* ── Exam helpers ── */
  const selectOpt = (oi) => {
    if (phase !== 'exam') return;
    setAnswers(prev => ({ ...prev, [currentQ]: oi }));
  };

  const handleImageUpload = (qi, file) => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    setImages(prev => ({ ...prev, [qi]: { src, file } }));
  };

  const removeImage = (qi) => {
    setImages(prev => {
      const next = { ...prev };
      delete next[qi];
      return next;
    });
  };

  const total          = questions.length;
  const answeredCount  = Object.keys(answers).length;
  const imagesCount    = Object.keys(images).length;
  // Mandatory: every answered question must have an image
  const missingImages  = Object.keys(answers).filter(qi => !images[qi]);
  const canSubmit      = answeredCount > 0 && missingImages.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setSubmitWarn(true);
      return;
    }
    clearInterval(timerRef.current);
    
    // Calculate performance
    const finalScore = questions.filter((q, i) => answers[i] === q.ans).length;
    const percentage = (finalScore / total) * 100;
    let performance = "Needs Improvement";
    if (percentage >= 80) performance = "Excellent";
    else if (percentage >= 60) performance = "Good";
    else if (percentage >= 40) performance = "Average";

    try {
      if (user?.id) {
        await fetch(`${NODE_API_URL}/api/exam/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            subject: subject,
            chapter: chapter,
            data: {
              prompt: examPrompt,
              questions: questions,
              user_answers: answers,
              marks: finalScore,
              total_questions: total
            },
            input_token: examTokens.prompt_tokens || 0,
            output_token: examTokens.completion_tokens || 0,
            total_token: examTokens.total_token || 0,
            evolve_comment: { performance },
            chat_type: 'exam',
            chat_title: `${subject} - ${chapter} Exam`
          })
        });
      }
    } catch (e) {
      console.error('Failed to save exam data', e);
    }
    
    setPhase('review');
  };

  /* ── Nav cell class ── */
  const navClass = (qi) => {
    if (qi === currentQ) return 'current';
    if (answers[qi] !== undefined && images[qi]) return 'answered';
    if (answers[qi] !== undefined && !images[qi]) return 'needs-image';
    if (marked[qi]) return 'marked';
    return '';
  };

  const score = questions.filter((q, i) => answers[i] === q.ans).length;

  /* ════════════════════════════════════════
     SETUP — Form UI
  ════════════════════════════════════════ */
  if (phase === 'setup') {
    if (isTyping) {
      return (
        <div className="quiz-loading">
          <div className="quiz-spinner" />
          <p>Generating your perfect exam...</p>
        </div>
      );
    }

    return (
      <div className="mode-body exam-setup-container">
        {!selectedMode ? (
          <>
            <div className="exam-setup-header">
              <h2>Choose Your Exam Mode</h2>
              <p>Select how you want to test your knowledge today.</p>
            </div>
            <div className="exam-type-cards">
              <div className="exam-type-card" onClick={() => setSelectedMode('chapter')}>
                <span className="exam-type-icon">📖</span>
                <span className="exam-type-title">Chapter Test</span>
              </div>
              <div className="exam-type-card" onClick={() => setSelectedMode('subject')}>
                <span className="exam-type-icon">🧪</span>
                <span className="exam-type-title">Subject Test</span>
              </div>
              <div className="exam-type-card" onClick={() => setSelectedMode('mock')}>
                <span className="exam-type-icon">🔥</span>
                <span className="exam-type-title">Full JEE Mock</span>
              </div>
            </div>
          </>
        ) : (
          <div className="exam-setup-form">
            <button className="exam-back-btn" onClick={() => setSelectedMode(null)}>
              <ArrowLeft size={14} /> Back to modes
            </button>
            <div className="mode-section-title">
              {selectedMode === 'chapter' && 'Chapter Test Configuration'}
              {selectedMode === 'subject' && 'Subject Test Configuration'}
              {selectedMode === 'mock' && 'Full JEE Mock Configuration'}
            </div>

            {(selectedMode === 'chapter' || selectedMode === 'subject') && (
              <div className="exam-form-group">
                <label>Subject</label>
                <select className="exam-input" value={formSubject} onChange={e => setFormSubject(e.target.value)}>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Maths">Mathematics</option>
                </select>
              </div>
            )}

            {selectedMode === 'chapter' && (
              <div className="exam-form-group">
                <label>Chapter Name</label>
                <input 
                  type="text" 
                  className="exam-input" 
                  placeholder="e.g. Kinematics, Thermodynamics..." 
                  value={formChapter} 
                  onChange={e => setFormChapter(e.target.value)} 
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="exam-form-group">
                <label>Difficulty</label>
                <select className="exam-input" value={formDifficulty} onChange={e => setFormDifficulty(e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="JEE Advanced">JEE Advanced level</option>
                </select>
              </div>
              <div className="exam-form-group">
                <label>Questions</label>
                <select className="exam-input" value={formQuestions} onChange={e => setFormQuestions(Number(e.target.value))}>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            <div className="exam-form-group">
              <label>Additional Tips / Focus (Optional)</label>
              <textarea 
                className="exam-input" 
                rows={2} 
                placeholder="e.g. Focus heavily on pulleys and friction..."
                value={formTips}
                onChange={e => setFormTips(e.target.value)}
              />
            </div>

            {errorMsg && <div className="quiz-error-msg">{errorMsg}</div>}

            <button 
              className="exam-generate-btn" 
              onClick={handleGenerateExam}
              disabled={selectedMode === 'chapter' && !formChapter.trim()}
            >
              Generate Exam
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════
     EXAM
  ════════════════════════════════════════ */
  if (phase === 'exam') {
    const q = questions[currentQ];
    return (
      <div className="mode-body" style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

        {/* Warning overlay */}
        {submitWarn && (
          <div className="exam-warn-overlay">
            <div className="exam-warn-card">
              <AlertTriangle size={32} style={{ color: '#fbbf24', marginBottom: 12 }} />
              <h3>Handwritten Solution Required</h3>
              <p>
                You have answered <strong>{answeredCount}</strong> question{answeredCount > 1 ? 's' : ''} but only uploaded
                solutions for <strong>{imagesCount}</strong>.<br /><br />
                Every answered question <em>must</em> have a photo of your handwritten solution before submitting.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="quiz-btn-retry" onClick={() => setSubmitWarn(false)}>
                  Go Back &amp; Upload
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="exam-layout" style={{ flex: 1, overflow: 'hidden', padding: '24px', margin: 0, height: '100%' }}>
          {/* ── Left: Question ── */}
          <div className="exam-main" style={{ overflowY: 'auto', paddingRight: '12px' }}>
            <div className="exam-q-label">
              <span style={{ color: '#fb923c', marginRight: '6px' }}>{examType}</span>
              • {q.subject} — Question {currentQ + 1} of {total}
            </div>
            <p className="exam-q-text">{q.q}</p>

            <div className="exam-opts">
              {q.opts.map((opt, oi) => (
                <button
                  key={oi}
                  className={`exam-opt-btn ${answers[currentQ] === oi ? 'selected' : ''}`}
                  onClick={() => selectOpt(oi)}
                >
                  <span className="exam-opt-letter">{String.fromCharCode(65 + oi)}</span>
                  {opt}
                </button>
              ))}
            </div>

            {/* ── Mandatory image upload ── */}
            <div className="exam-upload-section">
              <div className="exam-upload-label">
                <Upload size={13} />
                <span>Handwritten Solution</span>
                <span className="exam-upload-required">Required</span>
              </div>

              {images[currentQ] ? (
                <div className="exam-upload-preview">
                  <img src={images[currentQ].src} alt="Solution" className="exam-solution-img" />
                  <button className="exam-remove-img" onClick={() => removeImage(currentQ)} title="Remove">
                    <X size={12} />
                  </button>
                  <div className="exam-upload-done">
                    <CheckCircle size={14} style={{ color: '#34d399' }} /> Solution uploaded
                  </div>
                </div>
              ) : (
                <div
                  className={`exam-upload-zone ${answers[currentQ] !== undefined ? 'needs-upload' : ''}`}
                  onClick={() => imgRefs.current[currentQ]?.click()}
                >
                  <span className="exam-upload-icon">📸</span>
                  <p>
                    {answers[currentQ] !== undefined
                      ? 'You selected an answer — please upload your handwritten solution'
                      : 'Upload a photo of your handwritten working'}
                  </p>
                  <span className="exam-upload-hint">Click to browse · JPEG, PNG, HEIC</span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={el => imgRefs.current[currentQ] = el}
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(currentQ, e.target.files?.[0])}
              />
            </div>

            <div className="exam-nav-actions">
              <button className="exam-nav-btn" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>← Prev</button>
              <button
                className={`exam-nav-btn mark ${marked[currentQ] ? 'active' : ''}`}
                onClick={() => setMarked(prev => ({ ...prev, [currentQ]: !prev[currentQ] }))}
                style={marked[currentQ] ? { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' } : {}}
              >
                {marked[currentQ] ? '★ Marked' : '☆ Mark'}
              </button>
              <button className="exam-nav-btn" onClick={() => setCurrentQ(q => Math.min(total - 1, q + 1))} disabled={currentQ === total - 1}>Next →</button>
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="exam-sidebar" style={{ overflowY: 'auto', paddingRight: '12px' }}>
            <div className="exam-timer-card">
              <div className="exam-timer-label">Time Elapsed</div>
              <div className="exam-timer-value">{formatTime(seconds)}</div>
            </div>

            <div className="exam-progress-card">
              <div className="exam-progress-label">Progress</div>
              <div className="exam-progress-bar-wrap">
                <div className="exam-progress-bar" style={{ width: `${(answeredCount / total) * 100}%` }} />
              </div>
              <div className="exam-progress-text">{answeredCount}/{total} answered · {imagesCount}/{answeredCount || 0} solutions uploaded</div>
            </div>

            <div className="exam-navigator-card">
              <div className="mode-section-title">Navigator</div>
              <div className="exam-nav-grid">
                {questions.map((_, qi) => (
                  <button key={qi} className={`nav-q-cell ${navClass(qi)}`} onClick={() => setCurrentQ(qi)} title={`Q${qi + 1}`}>
                    {qi + 1}
                  </button>
                ))}
              </div>
              <div className="exam-legend">
                <div className="legend-item"><div className="legend-dot current" />Current</div>
                <div className="legend-item"><div className="legend-dot answered" />Done ✓</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: '#f87171' }} />No solution</div>
                <div className="legend-item"><div className="legend-dot marked" />Marked</div>
              </div>
            </div>

            <div className="exam-submit-wrap">
              {!canSubmit && answeredCount > 0 && (
                <div className="exam-submit-hint">
                  ⚠ Upload handwritten solutions for {missingImages.length} question{missingImages.length > 1 ? 's' : ''} to submit
                </div>
              )}
              <button className="exam-submit-btn" onClick={handleSubmit}>
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     REVIEW
  ════════════════════════════════════════ */
  return (
    <div className="mode-body">
      <div className="exam-review-header">
        <div className="exam-review-score">{score}<span>/{total}</span></div>
        <div className="exam-review-stats">
          <div className="exam-review-stat correct">✓ Correct: {score}</div>
          <div className="exam-review-stat wrong">✗ Wrong / Skipped: {total - score}</div>
          <div className="exam-review-stat time">⏱ Time: {formatTime(seconds)}</div>
          <div className="exam-review-stat time">📸 Solutions uploaded: {imagesCount}/{total}</div>
          {examTokens.total_token > 0 && <div className="exam-review-stat time">🪙 Tokens used: {examTokens.total_token}</div>}
          <div className="exam-review-stat time">⭐ Performance: {(score / total) * 100 >= 80 ? 'Excellent' : (score / total) * 100 >= 60 ? 'Good' : (score / total) * 100 >= 40 ? 'Average' : 'Needs Improvement'}</div>
        </div>
      </div>

      {questions.map((q, qi) => {
        const userAns   = answers[qi];
        const isCorrect = userAns === q.ans;
        return (
          <div key={qi} className="quiz-q-card" style={{ marginBottom: 12, borderColor: isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)' }}>
            <div className="quiz-q-num-badge">{q.subject} · Q{qi + 1}</div>
            <p className="quiz-q-text">{q.q}</p>
            {images[qi] && (
              <div style={{ marginBottom: 10 }}>
                <img src={images[qi].src} alt="Your solution" style={{ maxHeight: 120, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}
            <div className="quiz-opts">
              {q.opts.map((opt, oi) => {
                let cls = '';
                if (oi === q.ans)         cls = 'opt-correct';
                else if (oi === userAns)  cls = 'opt-wrong';
                else                      cls = 'opt-dim';
                return (
                  <button key={oi} className={`quiz-opt-btn ${cls}`} disabled>
                    <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="quiz-explanation">
              {isCorrect ? '✓ Correct! ' : `✗ Correct: ${q.opts[q.ans]}. `}{q.exp}
            </div>
          </div>
        );
      })}
    </div>
  );
}
