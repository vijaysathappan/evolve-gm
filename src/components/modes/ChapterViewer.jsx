import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, ChevronRight, Play, Pause, FastForward, Rewind, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import './ChapterViewer.css';

export default function ChapterViewer({ 
  sections = [], 
  activeSectionIndex = 0, 
  onSectionClick, 
  isLoading,
  sectionExplanations = [],
  activeSentenceIndex = 0, 
  onSentenceClick, 
  teachState,
  onPlayPause,
  isExplainingLoading,
  onExit,
  learningStyle = 'basic', // 'ai_mastery' or 'basic'
  
  // NEW EVALUATION PROPS
  sessionId,
  allSections = [],
  subject,
  chapterName,
  personalization,
  onConceptEvaluated,
  user
}) {
  const pageTopRef = useRef(null);
  const activeParagraphRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const synth = window.speechSynthesis;

  // Evaluation state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  
  // Reset evaluation when active section changes
  useEffect(() => {
    setSelectedAnswer(null);
    setEvalResult(null);
  }, [activeSectionIndex]);

  // Text-To-Speech integration
  useEffect(() => {
    if (learningStyle !== 'ai_mastery' || !sections[activeSectionIndex]) return;
    
    if (teachState === 'explaining') {
      // Find the text for the current active sentence/paragraph
      const rawText = sections[activeSectionIndex]?.raw_text || '';
      const paragraphs = rawText.split('\n\n').filter(p => p.trim());
      const currentText = paragraphs[activeSentenceIndex] || '';
      
      if (currentText) {
        // Cancel any ongoing speech
        synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(currentText);
        // Optional: you can pick a voice here if needed
        // utterance.voice = synth.getVoices().find(v => v.name.includes('Google UK English Female')) || null;
        utterance.rate = 1.0;
        
        synth.speak(utterance);
      }
    } else if (teachState === 'paused') {
      synth.pause();
    } else {
      synth.cancel();
    }
    
    return () => synth.cancel();
  }, [teachState, activeSentenceIndex, activeSectionIndex, learningStyle, sections]);

  // Auto-scrolling removed per user request

  const renderInteractiveParagraphs = (rawText) => {
    if (!rawText) return null;
    const paragraphs = rawText.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paraText, pIdx) => {
      const isExplaining = pIdx === activeSentenceIndex && teachState === 'explaining';
      const isPaused = pIdx === activeSentenceIndex && teachState === 'paused';
      const isActive = isExplaining || isPaused;

      // In Mastery Mode, we highlight the currently explained paragraph differently
      const masteryClass = learningStyle === 'ai_mastery' && isActive ? 'mastery-active-paragraph' : '';

      return (
        <p 
          key={pIdx}
          ref={isActive ? activeParagraphRef : null}
          className={`article-paragraph ${masteryClass}`}
          onClick={() => onSentenceClick && onSentenceClick(pIdx)}
        >
          {paraText}
        </p>
      );
    });
  };

  const renderTables = (tables) => {
    if (!tables) return null;
    return Object.entries(tables).map(([tableName, tableData], idx) => {
      const cols = tableData.columns || [];
      const rows = tableData.rows || [];
      return (
        <div key={idx} className="article-table-wrapper">
          <h4 className="article-table-caption">{tableName}: {tableData.caption}</h4>
          <div className="table-responsive">
            <table className="article-table">
              <thead>
                <tr>
                  {cols.map((col, cIdx) => <th key={cIdx}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {cols.map((col, cIdx) => <td key={cIdx}>{row[col]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tableData.footnote && <p className="article-table-footnote">*{tableData.footnote}*</p>}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="chapter-viewer-container flex-col items-center justify-center" style={{ height: '100%' }}>
        <div className="loader-small" style={{ width: '40px', height: '40px', borderTopColor: '#8b5cf6' }}></div>
        <p style={{ marginTop: '16px', color: '#a3a3a3', fontWeight: 500 }}>Preparing your personalized lesson...</p>
      </div>
    );
  }

  const currentSection = sections[activeSectionIndex];

  return (
    <div className="chapter-viewer-layout">
      {/* LEFT SIDEBAR: Table of Contents */}
      <div className={`chapter-toc-sidebar custom-scrollbar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="toc-header">
          <div className="phase-pill">Chapter Topics</div>
        </div>
        <div className="toc-list">
          {(allSections.length > 0 ? allSections : sections).map((sec, idx) => {
            // In basic mode, everything is unlocked
            const isUnlocked = learningStyle === 'basic' || idx <= activeSectionIndex;
            return (
              <div 
                key={idx} 
                className={`toc-item ${activeSectionIndex === idx ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => {
                  if (isUnlocked && onSectionClick) onSectionClick(idx);
                }}
                style={{ opacity: isUnlocked ? 1 : 0.5, cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
              >
                <div className="toc-number">{idx + 1}.</div>
                <div className="toc-title">{sec.title}</div>
                {!isUnlocked && <div className="toc-lock" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>🔒</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: Main Content */}
      <div className="chapter-main-content custom-scrollbar">
        <div ref={pageTopRef} />
        
        {currentSection ? (
          <div className="article-container">
            <div className="article-meta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="sidebar-toggle-btn"
                title={isSidebarOpen ? "Collapse Index" : "Expand Index"}
              >
                {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
              <span className="phase-tag">Topic {activeSectionIndex + 1}</span>
            </div>
            
            <h1 className="article-title">{currentSection.title}</h1>
            
            <div className="article-subheader">
              <div className="read-time flex-row items-center gap-2">
                <Clock size={14} />
                <span>15 min read</span>
              </div>
              <div className="prerequisites flex-row items-center gap-2">
                <span>Prerequisites:</span>
                <a href="#">Previous Topic</a>
              </div>
            </div>

            <div className="article-divider"></div>
            
            {/* Playback Controls (if AI Mastery is on) */}
            {learningStyle === 'ai_mastery' && (
              <div className="voice-controls flex-row items-center gap-4">
                <button className="voice-btn" onClick={() => {}} title="Rewind">
                  <Rewind size={18} />
                </button>
                <button className="voice-btn primary" onClick={() => {
                  if (teachState === 'idle') {
                    onSentenceClick(activeSentenceIndex);
                  } else if (onPlayPause) {
                    onPlayPause();
                  }
                }} title="Play / Pause">
                  {teachState === 'explaining' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button className="voice-btn" onClick={() => {}} title="Fast Forward">
                  <FastForward size={18} />
                </button>
                <div className="voice-status">
                  {teachState === 'explaining' ? 'AI is teaching...' : (teachState === 'paused' ? 'Paused' : 'Ready')}
                </div>
              </div>
            )}

            <div className="article-body formatted-text">
              {isExplainingLoading ? (
                <div className="flex-col items-center py-16 text-secondary gap-3">
                  <div className="loader-small" style={{ borderTopColor: '#8b5cf6' }}></div>
                  <span style={{ color: '#a3a3a3' }}>AI is analyzing the concept...</span>
                </div>
              ) : (
                renderInteractiveParagraphs(currentSection.raw_text)
              )}
              
              {!isExplainingLoading && (
                <div className="article-extras">
                  {renderTables(currentSection.table)}
                </div>
              )}

              {/* EVALUATION SECTION (Only in AI Mastery mode) */}
              {!isExplainingLoading && currentSection.question && learningStyle === 'ai_mastery' && (
                <div className="evaluation-block" style={{ marginTop: '48px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ marginTop: 0, color: '#f1f5f9', fontSize: '1.2rem', marginBottom: '16px' }}>Knowledge Check</h3>
                  <p style={{ color: '#e2e8f0', marginBottom: '20px', fontSize: '1.05rem' }}>{currentSection.question.text}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {currentSection.question.options?.map((opt, oIdx) => (
                      <button 
                        key={oIdx}
                        onClick={() => setSelectedAnswer(oIdx)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: selectedAnswer === oIdx ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                          background: selectedAnswer === oIdx ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </button>
                    ))}
                  </div>
                  
                  {evalResult && (
                    <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: evalResult.is_correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: evalResult.is_correct ? '#22c55e' : '#ef4444' }}>
                      {evalResult.is_correct ? 'Correct! Generating next concept...' : 'Incorrect. The AI will explain this differently.'}
                    </div>
                  )}

                  <button 
                    disabled={selectedAnswer === null || isEvaluating}
                    onClick={async () => {
                      setIsEvaluating(true);
                      setEvalResult(null);
                      try {
                        const { LLM_API_URL } = require('../../config/api');
                        const res = await fetch(`${LLM_API_URL}/api/learn/evaluate_concept`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            user_id: user?.id || user?.userId || 'unknown',
                            session_id: sessionId,
                            subject: subject,
                            chapter_name: chapterName,
                            current_concept_index: activeSectionIndex,
                            user_answer_index: selectedAnswer,
                            all_sections: allSections,
                            personalization: personalization,
                            question_data: currentSection.question
                          })
                        });
                        const data = await res.json();
                        setEvalResult({ is_correct: data.is_correct });
                        
                        // If it's incorrect, data.concept contains the simplified re-taught version
                        if (!data.complete && data.concept) {
                          onConceptEvaluated && onConceptEvaluated(data.concept);
                        }
                      } catch(e) {
                        console.error('Eval error', e);
                      } finally {
                        setIsEvaluating(false);
                      }
                    }}
                    style={{
                      padding: '12px 24px',
                      background: selectedAnswer === null ? '#333' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: selectedAnswer === null ? '#888' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: selectedAnswer === null || isEvaluating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="article-container">
            <p>No content loaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
