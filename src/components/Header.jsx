import React from 'react';
import { BookOpen, Share2, Settings, Plus } from 'lucide-react';
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">
          <BookOpen size={24} color="var(--accent-blue)" />
        </div>
        <span className="app-title">Evolve GM</span>
      </div>
      
      <div className="header-right">
        <button className="header-btn pill-btn primary">
          <Plus size={16} />
          <span>New session</span>
        </button>
        <button className="header-btn pill-btn outline">
          <Share2 size={16} />
          <span>Share</span>
        </button>
        <button className="header-btn icon-btn">
          <Settings size={20} />
        </button>
        <div className="user-avatar" title="NEET Aspirant Profile">
          JD
        </div>
      </div>
    </header>
  );
}
