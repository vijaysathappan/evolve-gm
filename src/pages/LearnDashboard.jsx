import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, X, Play, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChapterViewer from '../components/modes/ChapterViewer';
import AITeacherPane from '../components/modes/AITeacherPane';
import SpeakingPanel from '../components/modes/SpeakingPanel';
import { NODE_API_URL } from '../config/api';
import './LearnDashboard.css';

const CHAPTERS_BY_SUBJECT = {
  'Physics': [{ id: 'physics_ch1', name: 'Class 11 Chapter 1: Units and Measurement' }],
  'Chemistry': [{ id: 'chem_ch1', name: 'Chapter 1: Chemical Bonding', isWeak: true }],
  'Mathematics': [{ id: 'math_ch1', name: 'Chapter 1: Coordinate Geometry', isWeak: true }],
};

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const storageKey = (sub, ch, secTitle) =>
  `ev_${sub}_${ch}_${secTitle}`.replace(/\s+/g, '_').toLowerCase();
const chatKey = (sub, ch) =>
  `ev_chat_${sub}_${ch}`.replace(/\s+/g, '_').toLowerCase();

const saveExplanation = (sub, ch, secTitle, exps) => {
  try { localStorage.setItem(storageKey(sub, ch, secTitle), JSON.stringify({ exps, ts: Date.now() })); } catch { }
};
const loadExplanation = (sub, ch, secTitle) => {
  try {
    const d = localStorage.getItem(storageKey(sub, ch, secTitle));
    return d ? JSON.parse(d).exps : null;
  } catch { return null; }
};
const saveChatHistory = (sub, ch, msgs) => {
  try { localStorage.setItem(chatKey(sub, ch), JSON.stringify(msgs)); } catch { }
};
const loadChatHistory = (sub, ch) => {
  try {
    const d = localStorage.getItem(chatKey(sub, ch));
    return d ? JSON.parse(d) : [];
  } catch { return []; }
};

export default function LearnDashboard({ user, activeLearnChapter, setActiveLearnChapter }) {
  const navigate = useNavigate();

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [modeState, setModeState] = useState('learning'); // Skip prompt
  const [subject, setSubject] = useState(activeLearnChapter?.subject || '');
  const [chapter, setChapter] = useState(activeLearnChapter?.chapter || '');
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isChapterOpen, setIsChapterOpen] = useState(false);

  // ── Lesson content ────────────────────────────────────────────────────────────
  const [sections, setSections] = useState([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionExplanations, setSectionExplanations] = useState([]);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);
  const [teachState, setTeachState] = useState('idle');
  const [isExplainingLoading, setIsExplainingLoading] = useState(false);

  // ── Ticker ────────────────────────────────────────────────────────────────────
  const [tickerText, setTickerText] = useState('');
  const [tickerWS, setTickerWS] = useState(-1);
  const [tickerWE, setTickerWE] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Doubt ─────────────────────────────────────────────────────────────────────
  const [doubtText, setDoubtText] = useState('');
  const [isListening, setIsListening] = useState(false);



  // ── Start Learning ────────────────────────────────────────────────────────────
  const handleStartLearning = async (subj = subject, chap = chapter) => {
    if (!subj.trim() || !chap.trim()) return;
    setModeState('learning');
    setIsGenerating(true);
    setSectionExplanations([]);
    setTickerText(''); setTickerWS(-1); setTickerWE(-1);
    try {
      const res = await fetch(`${NODE_API_URL}/api/learn/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subj, chapter: chap }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.sections?.length > 0) {
        setSections(data.sections);
        setActiveSectionIndex(0);
      } else {
        throw new Error('No sections generated.');
      }
    } catch (err) {
      console.error('Failed to generate lesson:', err);
      setSections([{ title: 'Generation Failed', raw_text: `Could not generate content for ${chap}. Please try again later. Error: ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeLearnChapter) {
      setSubject(activeLearnChapter.subject);
      setChapter(activeLearnChapter.chapter);
      // Wait for state to update
      setTimeout(() => {
        handleStartLearning(activeLearnChapter.subject, activeLearnChapter.chapter);
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLearnChapter]);

  const handlePlayPause = () => {
    setTeachState(prev => (prev === 'explaining' ? 'paused' : 'explaining'));
  };

  const handleSkipForward = (seconds) => {
    console.log(`Skipping forward ${seconds}s`);
    // Placeholder for actual skip forward implementation
  };

  const handleSkipBackward = (seconds) => {
    console.log(`Skipping backward ${seconds}s`);
    // Placeholder for actual skip backward implementation
  };

  // ── Fetch explanations for active section ─────────────────────────────────────
  useEffect(() => {
    if (!sections?.length) return;
    const sec = sections[activeSectionIndex];
    if (!sec) return;

    const cached = loadExplanation(subject, chapter, sec.title);
    if (cached) {
      setSectionExplanations(cached);
      setActiveParagraphIndex(0);
      setTeachState('explaining');
      return;
    }

    const fetchExps = async () => {
      setIsExplainingLoading(true);
      setTeachState('idle');
      setActiveParagraphIndex(0);
      setSectionExplanations([]);
      setTickerText(''); setTickerWS(-1); setTickerWE(-1);
      try {
        const res = await fetch(`${NODE_API_URL}/api/learn/explain-section`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section_title: sec.title,
            raw_text: sec.raw_text,
            user_id: user?.id || user?.userId,
            subject,
            chapter,
            sections,
            active_idx: activeSectionIndex,
          }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.explanations?.length > 0) {
          setSectionExplanations(data.explanations);
          saveExplanation(subject, chapter, sec.title, data.explanations);
          setTeachState('explaining');
        } else {
          console.warn('No explanations generated for section:', sec.title);
          setSectionExplanations(['No explanation available for this section.']);
        }
      } catch (err) {
        console.error('Failed to fetch explanations:', err);
        setSectionExplanations(['Failed to load explanations for this section.']);
      } finally {
        setIsExplainingLoading(false);
      }
    };
    fetchExps();
  }, [activeSectionIndex, sections]);

  // ── PROMPT MODAL REMOVED ─────────────────────────────────────────────────────

  // ── CLASSROOM VIEW (no sidebar) ───────────────────────────────────────────────
  if (!activeLearnChapter) {
    return (
      <div className="cr-root flex-col items-center justify-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
          Select a chapter from the sidebar to start learning
        </div>
      </div>
    );
  }

  return (
    <div className="cr-root">
      <div className="cr-main no-sidebar">

        {/* LEFT: Interactive Book */}
        <div className="cr-screen-content-wrapper">
          <div className="cr-screen-topbar">
            <div className="cr-screen-badge">
              <span className="cr-screen-dot" />
              INTERACTIVE BOOK
            </div>
            <span className="cr-screen-subject">
              {subject} &middot; {chapter?.replace('Class 11 ', '')}
            </span>
            <button
              className="cr-exit-btn"
              onClick={() => setActiveLearnChapter(null)}
              title="Exit Chapter"
            >
              <X size={15} /> Exit
            </button>
          </div>

          <div className="cr-screen-content">
            <ChapterViewer
              sections={sections}
              activeSectionIndex={activeSectionIndex}
              onSectionClick={setActiveSectionIndex}
              isLoading={isGenerating}
              sectionExplanations={sectionExplanations}
              activeSentenceIndex={activeParagraphIndex}
              onSentenceClick={(idx) => { setActiveParagraphIndex(idx); setTeachState('explaining'); }}
              teachState={teachState}
              isExplainingLoading={isExplainingLoading}
              onExit={() => setModeState('prompt')}
              screenShareMode={true}
            />
          </div>
        </div>

        {/* RIGHT: Doubt / Discussion Chat */}
        <div className="cr-chat-zone">
          <AITeacherPane
            user={user}
            subject={subject}
            chapter={chapter}
            sections={sections}
            activeSectionIndex={activeSectionIndex}
            setActiveSectionIndex={setActiveSectionIndex}
            isGenerating={isGenerating}
            sectionExplanations={sectionExplanations}
            activeSentenceIndex={activeParagraphIndex}
            setActiveSentenceIndex={setActiveParagraphIndex}
            teachState={teachState}
            setTeachState={setTeachState}
            isExplainingLoading={isExplainingLoading}
            doubtText={doubtText}
            setDoubtText={setDoubtText}
            isListening={isListening}
            setIsListening={setIsListening}
            saveChatHistory={(msgs) => saveChatHistory(subject, chapter, msgs)}
            loadChatHistory={() => loadChatHistory(subject, chapter)}
            onTickerUpdate={(text, ws, we, speaking) => {
              setTickerText(text); setTickerWS(ws); setTickerWE(we); setIsSpeaking(speaking);
            }}
          />
        </div>

      </div>

      {/* Speaking Panel */}
      <SpeakingPanel
        tickerText={tickerText}
        tickerWS={tickerWS}
        tickerWE={tickerWE}
        isSpeaking={isSpeaking}
        onPlayPause={handlePlayPause}
        onSkipForward={handleSkipForward}
        onSkipBackward={handleSkipBackward}
      />
    </div>
  );
}