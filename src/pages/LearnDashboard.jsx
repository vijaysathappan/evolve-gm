import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, X, Play, ChevronDown, GripVertical, Columns, LayoutPanelLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChapterViewer from '../components/modes/ChapterViewer';
import AITeacherPane from '../components/modes/AITeacherPane';
import SpeakingPanel from '../components/modes/SpeakingPanel';
import { NODE_API_URL, LLM_API_URL } from '../config/api';
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
  const [modeState, setModeState] = useState('menu'); // menu, loading, learning
  const [learningStyle, setLearningStyle] = useState('basic'); // 'basic' | 'ai_mastery' or 'basic'
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
  const [tickerWE, setTickerWE] = useState(0);
  
  const [bookWidth, setBookWidth] = useState(65);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);

  // ── RESIZE HANDLERS ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSplitter) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setBookWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsDraggingSplitter(false);

    if (isDraggingSplitter) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Disable text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Doubt ─────────────────────────────────────────────────────────────────────
  const [doubtText, setDoubtText] = useState('');
  const [isListening, setIsListening] = useState(false);



  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [personalizationInput, setPersonalizationInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [allSections, setAllSections] = useState([]);

  // ── Start Learning ────────────────────────────────────────────────────────────
  const handleStartLearning = async (subj = subject, chap = chapter, personalization = '') => {
    if (!subj.trim() || !chap.trim()) return;
    setModeState('learning');
    setIsGenerating(true);
    setSectionExplanations([]);
    setTickerText(''); setTickerWS(-1); setTickerWE(-1);
    setShowPersonalizationModal(false);
    
    try {
      const endpoint = learningStyle === 'basic' ? '/api/learn/raw_content' : '/api/learn/personalize_start';
      const res = await fetch(`${LLM_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.id || user?.userId || 'unknown',
          subject: subj, 
          class_level: "Class 11", // Default for now
          chapter_name: chap,
          personalization: personalization || 'Make it easy to understand'
        }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (data.all_sections) {
        setSessionId(data.session_id || null);
        setAllSections(data.all_sections || []);
        
        if (learningStyle === 'basic') {
          // Display all sections instantly for basic mode
          setSections(data.all_sections);
          setActiveSectionIndex(0);
          setSectionExplanations(data.all_sections.map(s => s.raw_text));
        } else {
          // Sequential generation for AI Mastery
          setSections([data.concept]);
          setActiveSectionIndex(0);
          setSectionExplanations([data.concept.raw_text]);
        }
        
        setActiveParagraphIndex(0);
        setTeachState(learningStyle === 'basic' ? 'idle' : 'explaining');
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
      if (learningStyle === 'ai_mastery') {
        setShowPersonalizationModal(true);
      } else {
        // Just start default
        handleStartLearning(activeLearnChapter.subject, activeLearnChapter.chapter, '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLearnChapter, learningStyle]);

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

  // We no longer need the old explain-section effect because personalize_start 
  // generates the explanation directly.
  
  const handleConceptEvaluated = (newConcept) => {
    if (newConcept) {
      setSections(prev => [...prev, newConcept]);
      setActiveSectionIndex(prev => prev + 1);
      setSectionExplanations([newConcept.raw_text]);
      setActiveParagraphIndex(0);
      setTeachState('explaining');
    }
  };

  // ── PERSONALIZATION MODAL ─────────────────────────────────────────────────────
  const renderPersonalizationModal = () => {
    if (!showPersonalizationModal) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: '#1e1e2e', padding: '32px', borderRadius: '16px', width: '500px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '1.5rem' }}>Personalize Your Learning</h2>
          <p style={{ color: '#a3a3a3', marginBottom: '24px' }}>How would you like the AI to explain this chapter? (e.g. "Explain like I'm 5", "Use football analogies", "Focus heavily on numericals")</p>
          <input 
            type="text" 
            value={personalizationInput}
            onChange={(e) => setPersonalizationInput(e.target.value)}
            placeholder="Your preference..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', marginBottom: '24px', fontSize: '1rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => setShowPersonalizationModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#a3a3a3', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => handleStartLearning(subject, chapter, personalizationInput)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Start Learning</button>
          </div>
        </div>
      </div>
    );
  };

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
        {renderPersonalizationModal()}
        {/* LEFT: Interactive Book */}
        <div className="cr-screen-content-wrapper" style={{ width: `${bookWidth}%`, flex: 'none' }}>
          <div className="cr-screen-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="cr-screen-badge" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                <button 
                  onClick={() => setLearningStyle('ai_mastery')}
                  style={{ background: learningStyle === 'ai_mastery' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent', color: learningStyle === 'ai_mastery' ? '#fff' : '#a3a3a3', border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: learningStyle === 'ai_mastery' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none' }}>
                  AI Mastery
                </button>
                <button 
                  onClick={() => setLearningStyle('basic')}
                  style={{ background: learningStyle === 'basic' ? '#333' : 'transparent', color: learningStyle === 'basic' ? '#fff' : '#a3a3a3', border: 'none', borderRadius: '16px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  CBSE Basic
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '6px 16px', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                <span style={{ color: '#94a3b8' }}>{subject}</span>
                <span style={{ color: '#475569', margin: '0 10px' }}>&bull;</span>
                <span style={{ color: '#f1f5f9' }}>{chapter?.replace('Class 11 ', '')}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>


              <button
                className="cr-exit-btn"
                onClick={() => setActiveLearnChapter(null)}
              title="Exit Chapter"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <X size={16} /> Exit
            </button>
          </div>
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
              onPlayPause={handlePlayPause}
              isExplainingLoading={isExplainingLoading}
              onExit={() => setActiveLearnChapter(null)}
              learningStyle={learningStyle}
              // NEW PROPS FOR EVALUATION
              sessionId={sessionId}
              allSections={allSections}
              subject={subject}
              chapterName={chapter}
              personalization={personalizationInput}
              onConceptEvaluated={handleConceptEvaluated}
              user={user}
            />
          </div>
        </div>

        {/* SPLITTER */}
        <div 
          className="cr-splitter"
          onMouseDown={() => setIsDraggingSplitter(true)}
          style={{ 
            width: '8px', 
            cursor: 'col-resize', 
            background: isDraggingSplitter ? '#8b5cf6' : 'rgba(255,255,255,0.02)', 
            transition: 'background 0.2s',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)'
          }}
        >
          <GripVertical size={16} />
        </div>

        {/* RIGHT: Doubt / Discussion Chat */}
        <div className="cr-chat-zone" style={{ width: `calc(${100 - bookWidth}% - 8px)`, flex: 'none' }}>
          <AITeacherPane
            user={user}
            subject={subject}
            chapter={chapter}
            currentSection={sections[activeSectionIndex]}
            sections={sections}
            activeSectionIndex={activeSectionIndex}
            setActiveSectionIndex={setActiveSectionIndex}
            teachState={teachState}
            setTeachState={setTeachState}
            activeSentenceIndex={activeParagraphIndex}
            setActiveSentenceIndex={setActiveParagraphIndex}
            learningStyle={learningStyle}
            isExplainingLoading={isExplainingLoading}
            isGenerating={isGenerating}
            sectionExplanations={sectionExplanations}
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
    </div>
  );
}