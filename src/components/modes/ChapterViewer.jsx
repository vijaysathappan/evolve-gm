import React, { useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import './ChapterViewer.css';

export default function ChapterViewer({ 
  sections = [], 
  activeSectionIndex = 0, 
  onSectionClick, 
  isLoading,
  sectionExplanations = [],
  activeSentenceIndex = 0, // bound to active paragraph index
  onSentenceClick, // bound to onParagraphClick
  teachState,
  isExplainingLoading,
  onExit
}) {
  const pageTopRef = useRef(null);
  const activeParagraphRef = useRef(null);

  // Scroll page to top on section/page flip
  useEffect(() => {
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSectionIndex]);

  // Auto-scroll active paragraph into view smoothly
  useEffect(() => {
    if (activeParagraphRef.current && teachState === 'explaining') {
      activeParagraphRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSentenceIndex, teachState]);

  const renderInteractiveParagraphs = (rawText) => {
    if (!rawText) return null;
    const paragraphs = rawText.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paraText, pIdx) => {
      const isExplaining = pIdx === activeSentenceIndex && teachState === 'explaining';
      const isPaused = pIdx === activeSentenceIndex && teachState === 'paused';
      const isRead = pIdx < activeSentenceIndex;
      const isActive = isExplaining || isPaused;

      return (
        <p 
          key={pIdx}
          ref={isActive ? activeParagraphRef : null}
          className={`paragraph-block ${isActive ? 'active' : ''} ${isExplaining ? 'paragraph-explaining' : ''} ${isPaused ? 'paragraph-paused' : ''} ${isRead ? 'paragraph-read' : ''}`}
          onClick={() => onSentenceClick && onSentenceClick(pIdx)}
        >
          {/* Real book first-paragraph drop-cap style on paragraph 0 */}
          {pIdx === 0 && (
            <span className="drop-cap">{paraText.charAt(0)}</span>
          )}
          {pIdx === 0 ? paraText.slice(1) : paraText}
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
        <div key={idx} className="textbook-table-container">
          <h4 className="table-caption">{tableName}: {tableData.caption}</h4>
          <div className="table-responsive">
            <table className="textbook-table">
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
          {tableData.footnote && <p className="table-footnote">*{tableData.footnote}*</p>}
        </div>
      );
    });
  };

  const renderExamples = (examples) => {
    if (!examples) return null;
    return Object.entries(examples).map(([exName, exData], idx) => (
      <div key={idx} className="textbook-example-card">
        <h4 className="example-title">{exName}</h4>
        <div className="example-question">
          <strong>Question:</strong>
          <p>{exData.question}</p>
        </div>
        <div className="example-answer">
          <strong>Answer:</strong>
          <p>{exData.answer}</p>
        </div>
      </div>
    ));
  };

  const renderUnsolved = (unsolved) => {
    if (!unsolved) return null;
    return Object.entries(unsolved).map(([exName, exData], idx) => (
      <div key={idx} className="textbook-unsolved-card">
        <h4 className="unsolved-title">Exercise {exName}</h4>
        <p className="unsolved-text">{exData}</p>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="chapter-viewer-container flex-col items-center justify-center">
        <div className="book-loader"></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading textbook material...</p>
      </div>
    );
  }

  const currentSection = sections[activeSectionIndex];

  return (
    <div className="chapter-container flex-col">
      {/* Top Header Navigation */}
      <div className="chapter-viewer-header flex-row items-center justify-between">
        <div className="flex-row items-center gap-3">
          <button className="exit-btn flex-row items-center gap-1" onClick={onExit}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="flex-row items-center gap-2">
            <BookOpen size={16} color="var(--primary)" />
            <select 
              value={activeSectionIndex}
              onChange={(e) => onSectionClick && onSectionClick(Number(e.target.value))}
              className="section-select-toc"
              title="Table of Contents"
            >
              {sections.map((sec, idx) => (
                <option key={idx} value={idx}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="chapter-viewer-content-area flex-1">
        <div className="chapter-viewer-container custom-scrollbar">
          <div ref={pageTopRef} />
          
          {/* The Real Book Page layout */}
          {currentSection ? (
            <div className="book-page">
              {/* Page Header */}
              <div className="book-page-header flex-row items-center justify-between">
                <span className="book-header-left">CLASS 11 PHYSICS</span>
                <span className="book-header-right">{currentSection.title.toUpperCase()}</span>
              </div>
              
              {/* Page Body text in Georgia serif */}
              <div className="book-page-body formatted-text">
                <h1 className="book-section-title">{currentSection.title}</h1>
                
                {isExplainingLoading ? (
                  <div className="flex-col items-center py-16 text-secondary gap-2">
                    <div className="loader-small"></div>
                    <span>Preparing voice explanations...</span>
                  </div>
                ) : (
                  renderInteractiveParagraphs(currentSection.raw_text)
                )}
                
                {/* Tables and Worked Examples */}
                {!isExplainingLoading && (
                  <div className="book-page-extras">
                    {renderTables(currentSection.table)}
                    {renderExamples(currentSection.example_sums)}
                    {renderUnsolved(currentSection.unsolved_sums)}
                  </div>
                )}
              </div>
              
              {/* Page Footer with Page Number */}
              <div className="book-page-footer flex-row items-center justify-between">
                <span className="book-footer-left">Evolve Digital Book</span>
                <span className="book-page-number">Page {activeSectionIndex + 3}</span>
              </div>
            </div>
          ) : (
            <div className="book-page">
              <p>No content loaded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
