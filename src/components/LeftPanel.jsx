import React from 'react';
import { Plus, Search, Globe, FileText } from 'lucide-react';
import './LeftPanel.css';

export default function LeftPanel() {
  return (
    <aside className="panel side-panel">
      <div className="panel-header">
        <span className="panel-title">Sources</span>
        <button className="icon-btn-small" title="Hide panel">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        </button>
      </div>
      
      <div className="panel-content flex-col gap-4">
        <button className="add-source-btn">
          <Plus size={16} />
          <span>Add sources</span>
        </button>

        <div className="search-bar">
          <Search size={16} className="text-muted" />
          <input type="text" placeholder="Search the web for new sources" />
        </div>

        <div className="quick-filters">
          <button className="filter-chip">
            <Globe size={14} />
            <span>Web</span>
          </button>
          <button className="filter-chip">
            <Search size={14} />
            <span>Fast research</span>
          </button>
        </div>

        <div className="empty-sources flex-col items-center justify-center flex-1">
          <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p className="empty-text">Saved sources will appear here</p>
          <p className="empty-subtext">Click Add source above to add PDFs, websites, text, videos or audio files. Or import a file directly from Drive.</p>
        </div>
      </div>
    </aside>
  );
}
