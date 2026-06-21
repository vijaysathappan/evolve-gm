import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Send, Minimize2, ArrowUpRight, Loader2, SendHorizonal } from 'lucide-react';
import { NODE_API_URL, LLM_API_URL } from '../../config/api';
import './AITeacherPane.css';

export default function AITeacherPane({
  user, subject, chapter,
  sections = [], activeSectionIndex = 0, setActiveSectionIndex,
  isGenerating, sectionExplanations = [],
  activeSentenceIndex = 0, setActiveSentenceIndex,
  teachState, setTeachState, isExplainingLoading,
  doubtText, setDoubtText, isListening, setIsListening,
  onTickerUpdate,
  saveChatHistory,
  loadChatHistory
}) {
  const [isSpeaking,       setIsSpeaking]       = useState(false);
  const [messages,         setMessages]         = useState([]);
  const [thinking,         setThinking]         = useState(false);
  const [isAnsweringDoubt, setIsAnsweringDoubt] = useState(false);
  const [mouthOpen,        setMouthOpen]        = useState(false);

  const synthRef       = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voicesRef      = useRef([]);
  const mouthTimerRef  = useRef(null);

  // Load saved chat on mount
  useEffect(() => {
    if (loadChatHistory) {
      const saved = loadChatHistory();
      if (saved && saved.length > 0) setMessages(saved);
    }
  }, [subject, chapter]);

  // Save chat whenever messages change
  useEffect(() => {
    if (saveChatHistory && messages.length > 0) saveChatHistory(messages);
  }, [messages]);

  // ── Voices ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => { const v = synthRef.current?.getVoices() || []; if (v.length) voicesRef.current = v; };
    load();
    if (synthRef.current) synthRef.current.onvoiceschanged = load;
  }, []);

  const pickVoice = useCallback(() => {
    const v = voicesRef.current;
    return (
      v.find(x => x.lang === 'en-IN' || x.name.includes('Rishi') || x.name.includes('Heera')) ||
      v.find(x => x.lang === 'en-GB') || v.find(x => x.lang.startsWith('en')) || v[0]
    );
  }, []);

  // ── Speech recognition ────────────────────────────────────────────────────
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e) => {
        const t = e.results[0][0].transcript;
        setDoubtText(t);
        handleSendDoubt(t);
      };
      recognitionRef.current.onend   = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    return () => { synthRef.current?.cancel(); clearInterval(mouthTimerRef.current); };
  }, []);

  // Use manual scrollTop to prevent whole-page scrolling bugs
  const messagesContainerRef = useRef(null);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, thinking]);

  // ── Mouth animation toggle ────────────────────────────────────────────────
  const startMouthAnim = () => {
    clearInterval(mouthTimerRef.current);
    mouthTimerRef.current = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 300);
  };
  const stopMouthAnim = () => {
    clearInterval(mouthTimerRef.current);
    setMouthOpen(false);
  };

  // ── Welcome message ───────────────────────────────────────────────────────
  useEffect(() => {
    if (sections?.length > 0 && activeSectionIndex < sections.length) {
      const sec = sections[activeSectionIndex];
      if (sec) {
        setIsAnsweringDoubt(false);
        setMessages([{
          role: 'ai',
          text: `Hi! I'll walk you through "${sec.title}" — follow along with the text on the whiteboard.`,
          roleType: 'ai-welcome'
        }]);
      }
    }
  }, [activeSectionIndex, sections]);

  // ── Core speak ────────────────────────────────────────────────────────────
  const speakText = useCallback((text, { onEnd, forDoubt = false } = {}) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
    stopMouthAnim();
    onTickerUpdate?.(text, -1, -1, false);

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = 0.82;
    utt.pitch = 1.05;
    const voice = pickVoice();
    if (voice) utt.voice = voice;

    utt.onboundary = (e) => {
      if (e.name === 'word') {
        onTickerUpdate?.(text, e.charIndex, e.charIndex + (e.charLength || 0), true);
      }
    };

    utt.onstart = () => { setIsSpeaking(true); startMouthAnim(); onTickerUpdate?.(text, -1, -1, true); };

    utt.onend = () => {
      setIsSpeaking(false); stopMouthAnim();
      onTickerUpdate?.(text, -1, -1, false);
      if (forDoubt) setIsAnsweringDoubt(true);
      if (onEnd) onEnd();
    };

    utt.onerror = () => { setIsSpeaking(false); stopMouthAnim(); onTickerUpdate?.(text, -1, -1, false); };
    synth.speak(utt);
  }, [pickVoice, onTickerUpdate]);

  // ── Speak paragraph ───────────────────────────────────────────────────────
  const speakCurrentParagraph = useCallback(() => {
    if (isExplainingLoading || isGenerating || !sectionExplanations.length) return;
    const item = sectionExplanations[activeSentenceIndex];
    if (!item?.explanation) return;

    speakText(item.explanation, {
      onEnd: () => {
        if (activeSentenceIndex < sectionExplanations.length - 1) {
          // No pause — advance immediately for continuous flow
          setActiveSentenceIndex(p => p + 1);
          setTeachState('explaining');
        } else {
          setTeachState('idle');
          setMessages(prev => [...prev, {
            role: 'ai',
            text: "That's it for this section! Ask me anything or move to the next one.",
            roleType: 'ai-done'
          }]);
        }
      }
    });
  }, [activeSentenceIndex, sectionExplanations, isExplainingLoading, isGenerating, speakText, setActiveSentenceIndex, setTeachState]);

  // ── Effect: trigger speech ────────────────────────────────────────────────
  useEffect(() => {
    if (teachState === 'explaining' && !isExplainingLoading && sectionExplanations.length > 0) {
      const t = setTimeout(() => speakCurrentParagraph(), 300);
      return () => clearTimeout(t);
    }
    if (teachState === 'paused' || teachState === 'idle') {
      synthRef.current?.cancel();
      setIsSpeaking(false); stopMouthAnim();
      onTickerUpdate?.('', -1, -1, false);
    }
  }, [activeSentenceIndex, teachState, isExplainingLoading, sectionExplanations]);

  // ── Doubt ─────────────────────────────────────────────────────────────────
  const handleSendDoubt = async (override) => {
    const text = override ?? doubtText;
    if (!text.trim()) return;
    synthRef.current?.cancel(); setIsSpeaking(false); stopMouthAnim();
    setIsListening(false); setTeachState('paused');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setDoubtText(''); setThinking(true); setIsAnsweringDoubt(true);
    try {
      const res  = await fetch(`${LLM_API_URL}/api/learn/doubt`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, chapter, doubt: text,
          context: messages.map(m => `${m.role === 'ai' ? 'Tutor' : 'Student'}: ${m.text}`).join('\n'),
          user_id: user?.userId
        })
      });
      const data  = await res.json();
      const reply = data.answer || "I couldn't get an answer. Try again!";
      setMessages(prev => [...prev, { role: 'ai', text: reply, roleType: 'ai-doubt-answer' }]);
      speakText(reply, { forDoubt: true });
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: "Network error. Please retry.", roleType: 'ai-error' }]);
    } finally { setThinking(false); }
  };

  // ─────────────────────────────── RENDER ─────────────────────────────────
  return (
    <div className="tp-root">
      {/* ── CHAT SECTION ────────────────────────────────────────────────── */}
      <div className="tp-chat-section">
        <div className="tp-chat-header">
          <span className="tp-chat-title">💬 Discussion</span>
          {isAnsweringDoubt && !thinking && (
            <button className="tp-resume-btn" onClick={() => { setIsAnsweringDoubt(false); setTeachState('explaining'); }}>
              Resume ▶
            </button>
          )}
        </div>

        <div className="tp-messages" ref={messagesContainerRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`tp-msg ${msg.role}`}>
              {msg.role === 'ai' && <div className="tp-msg-av">AI</div>}
              <div className={`tp-msg-txt ${msg.roleType || ''}`}>{msg.text}</div>
            </div>
          ))}
          {thinking && (
            <div className="tp-msg ai">
              <div className="tp-msg-av">AI</div>
              <div className="tp-msg-txt tp-thinking">
                <span className="tp-d" /><span className="tp-d" /><span className="tp-d" />
              </div>
            </div>
          )}
        </div>

        <div className="tp-input-area">
          <input
            value={doubtText}
            onChange={(e) => setDoubtText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendDoubt()}
            placeholder="Ask a question..."
            disabled={thinking}
          />
          <button onClick={() => handleSendDoubt()} disabled={thinking || !doubtText.trim()}>
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
