import React, { useState } from 'react';
import { Upload, Link2, HardDrive, FileText, ArrowRight, Search as SearchIcon } from 'lucide-react';
import './CenterPanel.css';

export default function CenterPanel() {
  const [activeMode, setActiveMode] = useState('Reference');
  
  const modes = ['Reference', 'Doubt Mode', 'Teach Mode', 'Exam Mode'];

  return (
    <main className="panel center-panel" style={{ backgroundColor: 'transparent', border: 'none' }}>
      <div className="panel-header flex-col items-start gap-4" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex-row items-center justify-between w-full">
          <span className="panel-title" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Evolve Learn Module</span>
          <button className="icon-btn-small">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </button>
        </div>
        
        {/* Learning Mode Selector */}
        <div className="modes-bar flex-row">
          {modes.map(mode => (
            <button 
              key={mode}
              className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
              onClick={() => setActiveMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-content flex-col items-center justify-center">
        
        <div className="hero-section flex-col items-center">
          <h1 className="hero-title" style={{ marginTop: '2rem' }}>
            Learn faster with<br/>
            <span className="hero-gradient">NEET & JEE intelligent tutoring</span>
          </h1>

          <div className="search-box-large">
            <SearchIcon className="search-icon" size={20} />
            <input type="text" placeholder={`Search concepts for ${activeMode}...`} />
            <button className="submit-btn"><ArrowRight size={18} /></button>
          </div>

          <div className="upload-section">
            <h3 className="upload-title">or drop your files</h3>
            <p className="upload-subtitle">pdf, images, docs, audio, <span style={{ textDecoration: 'underline' }}>and more</span></p>

            <div className="upload-actions">
              <button className="upload-btn">
                <Upload size={16} />
                <span>Upload files</span>
              </button>
              <button className="upload-btn">
                <Link2 size={16} />
                <span>Websites</span>
              </button>
              <button className="upload-btn">
                <HardDrive size={16} />
                <span>Drive</span>
              </button>
              <button className="upload-btn">
                <FileText size={16} />
                <span>Copied text</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="bottom-input-area">
         <div className="chat-input-wrapper">
           <input type="text" placeholder="Start asking your doubts here or paste a link..." />
           <span className="source-count">0 sources</span>
           <button className="submit-btn outline-submit"><ArrowRight size={18} /></button>
         </div>
         <p className="disclaimer-text">Evolve GM uses LLMs and can hallucinate. Verify critical NEET/JEE formulas.</p>
      </div>
    </main>
  );
}
