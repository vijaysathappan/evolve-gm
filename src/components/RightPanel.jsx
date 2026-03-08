import React from 'react';
import { Sparkles, PlayCircle, Video, Waypoints, FileText, Layers, Target } from 'lucide-react';
import './RightPanel.css';

const tools = [
  { icon: PlayCircle, label: 'Audio Overview' },
  { icon: Video, label: 'Video Overview' },
  { icon: Waypoints, label: 'Mind Map' },
  { icon: FileText, label: 'Study Guides' },
  { icon: Layers, label: 'Flashcards' },
  { icon: Target, label: 'Quiz' },
];

export default function RightPanel() {
  return (
    <aside className="panel side-panel">
      <div className="panel-header">
        <span className="panel-title">Studio</span>
        <button className="icon-btn-small" title="Hide panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
        </button>
      </div>

      <div className="panel-content flex-col">
        <div className="studio-card">
          Create tailored study materials for <strong>NEET/JEE Exams</strong> from your uploaded text, syllabus, and queries.
        </div>

        <div className="tools-grid">
          {tools.map((tool, idx) => (
            <button key={idx} className="tool-btn">
              <tool.icon size={20} className="tool-icon" />
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="studio-empty flex-col items-center justify-center flex-1">
          <Sparkles size={24} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <p className="empty-text">Studio output will be saved here.</p>
          <p className="empty-subtext">After adding sources, click to add Audio Overview, study guides, mind map and more!</p>
        </div>
      </div>
    </aside>
  );
}
