import React, { useState } from 'react';
import { PanelRight, PanelLeft, History, FileText, Share2, Map as MindMapIcon, Sparkles } from 'lucide-react';
import './RightSidebar.css';

export default function RightSidebar() {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={`right-sidebar flex-col justify-between ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-top flex-col">
        <button 
          className="icon-btn toggle-btn align-end" 
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <PanelRight size={20} /> : <PanelLeft size={20} />}
        </button>

        {!expanded && (
          <div className="sidebar-content-collapsed fade-in-fast">
            <button className="icon-btn" title="Chat History"><History size={20} /></button>
            <button className="icon-btn" title="Session Sources"><FileText size={20} /></button>
            <button className="icon-btn" title="Intelligence Graph"><MindMapIcon size={20} /></button>
          </div>
        )}

        {expanded && (
          <div className="sidebar-content fade-in-fast">
            
            <section className="rs-section">
              <h3 className="rs-title flex-row items-center"><History size={16} /> Chat History</h3>
              <div className="rs-item flex-col">
                <span className="rs-text primary">Thermodynamics Revision</span>
                <span className="rs-text secondary">Today, 10:45 AM</span>
              </div>
              <div className="rs-item flex-col">
                <span className="rs-text primary">Newton's Laws Doubt</span>
                <span className="rs-text secondary">Yesterday</span>
              </div>
            </section>

            <section className="rs-section">
              <h3 className="rs-title flex-row items-center"><FileText size={16} /> Session Sources</h3>
              <div className="rs-item source-item flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="rs-text primary truncate">HC-Verma-Vol1.pdf</span>
                  <span className="rs-text secondary">Uploaded 20 mins ago</span>
                </div>
                <div className="status-dot success"></div>
              </div>
              <div className="rs-item source-item flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="rs-text primary truncate">Class Notes Pg1.png</span>
                  <span className="rs-text secondary">Processed</span>
                </div>
                <div className="status-dot success"></div>
              </div>
            </section>

            <section className="rs-section futuristic-section">
              <h3 className="rs-title flex-row items-center gap-sm">
                <MindMapIcon size={16} className="text-gradient-minimal" /> 
                <span className="text-gradient-minimal">Intelligence Graph</span>
              </h3>
              <div className="futuristic-map-box flex-col items-center justify-center">
                 <Sparkles size={24} color="var(--accent-blue)" style={{ marginBottom: '8px' }} />
                 <p className="small-text-center">Live Mind Map generating based on your current concept exploration...</p>
                 <div className="loading-bar mt-2">
                   <div className="loading-progress"></div>
                 </div>
              </div>
            </section>

          </div>
        )}
      </div>

      {expanded && (
        <div className="sidebar-bottom p-2">
           <button className="export-btn flex-row items-center justify-center w-full gap-2">
             <Share2 size={16} />
             <span>Export Session Data</span>
           </button>
        </div>
      )}
    </aside>
  );
}
