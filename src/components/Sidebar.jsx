import React, { useState, useEffect } from 'react';
import { Menu, Plus, MessageSquare, Settings, HelpCircle, X, Shield, Lock, FileText, Share2, Trash2, CreditCard } from 'lucide-react';
import BookLogo from './BookLogo';
import './Sidebar.css';

const MOCK_HISTORY = [
  { id: 1, title: 'Website Update LinkedIn Post Options' },
  { id: 2, title: 'Resume Skills Optimization For AI' },
  { id: 3, title: 'Functional Programming\'s Core Focus' },
  { id: 4, title: 'Calculus Integration Tricks' },
  { id: 5, title: 'Thermodynamics Laws Explained' },
  { id: 6, title: 'Organic Chemistry Reactions' },
  { id: 7, title: 'NEET Physics Mock Test' },
  { id: 8, title: 'Genetics and Evolution' },
  { id: 9, title: 'Kinematics Formulas' },
  { id: 10, title: 'Electrostatics Basics' },
];

export default function Sidebar({ user, onLogout }) {
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);

  const toggleSidebar = () => setExpanded(!expanded);

  useEffect(() => {
    const handleToggle = () => setExpanded(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const displayedHistory = showAllHistory ? history : history.slice(0, 3);

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setHistory(history.filter(item => item.id !== id));
  };

  const shareChat = (e, id) => {
    e.stopPropagation();
    alert('Share dialog opened for chat ID: ' + id);
  };

  return (
    <>
      <aside className={`gemini-sidebar flex-col justify-between ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-top flex-col">
          <div className="sidebar-header">
            <button 
              className="icon-btn menu-btn" 
              onClick={toggleSidebar}
              title={expanded ? 'Collapse menu' : 'Expand menu'}
            >
              <Menu size={24} />
            </button>
            
            <div className="sidebar-logo-container flex-col items-center justify-center">
              <BookLogo size="32px" />
            </div>
          </div>

          <div className="new-chat-wrapper">
            <button className="new-chat-btn" title="New Chat">
              <Plus size={20} className="plus-icon" />
              <span className="nav-label">New chat</span>
            </button>
          </div>

          <nav className={`nav-menu flex-col w-full ${showAllHistory ? 'scrollable-menu custom-scrollbar' : ''}`}>
             {expanded && history.length > 0 && <div className="recent-label">Recent</div>}
             
             {/* Chat History items */}
             {displayedHistory.map((chat) => (
               <div key={chat.id} className="nav-item history-item" title={chat.title}>
                 <div className="history-content flex-row items-center">
                   <MessageSquare size={18} strokeWidth={1.5} className="history-icon" />
                   <span className="nav-label truncate">{chat.title}</span>
                 </div>
                 
                 {expanded && (
                   <div className="history-actions flex-row items-center">
                     <button className="context-btn" onClick={(e) => shareChat(e, chat.id)} title="Share session">
                       <Share2 size={14} />
                     </button>
                     <button className="context-btn" onClick={(e) => deleteChat(e, chat.id)} title="Delete session">
                       <Trash2 size={14} />
                     </button>
                   </div>
                 )}
               </div>
             ))}

             {expanded && history.length > 3 && (
               <button 
                 className="show-more-btn"
                 onClick={() => setShowAllHistory(!showAllHistory)}
               >
                 {showAllHistory ? 'Show less' : 'Show more'}
               </button>
             )}
          </nav>
        </div>

        <div className="sidebar-bottom flex-col">
           <button className="nav-item" onClick={() => setShowSettings(true)} title="Settings">
             <Settings size={20} className="history-icon" />
             <span className="nav-label">Settings and help</span>
           </button>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay flex-row items-center justify-center">
          <div className="settings-modal flex-col">
             <div className="modal-header flex-row items-center justify-between">
                <h2>Settings & Privacy</h2>
                <button className="icon-btn" onClick={() => setShowSettings(false)}><X size={24} /></button>
             </div>
             <div className="modal-body flex-col gap-4">
                <div className="setting-card flex-row items-center">
                  <CreditCard size={24} className="setting-icon"/>
                  <div className="flex-col">
                    <span className="setting-title">Subscription Plan</span>
                    <span className="setting-desc">You are currently on the <strong>Evolve GM Free</strong> plan. Upgrade to unlock deeper thinking limits.</span>
                  </div>
                </div>
                <div className="setting-card flex-row items-center">
                  <Shield size={24} className="setting-icon"/>
                  <div className="flex-col">
                    <span className="setting-title">Your Data in Evolve GM</span>
                    <span className="setting-desc">Manage how your activity is saved and used to improve Evolve GM.</span>
                  </div>
                </div>
                <div className="setting-card flex-row items-center">
                  <Lock size={24} className="setting-icon"/>
                  <div className="flex-col">
                    <span className="setting-title">Privacy Hub</span>
                    <span className="setting-desc">Read our commitment to your privacy and security.</span>
                  </div>
                </div>
                <div className="setting-card flex-row items-center">
                  <FileText size={24} className="setting-icon"/>
                  <div className="flex-col">
                    <span className="setting-title">Terms of Service</span>
                    <span className="setting-desc">Review the terms regarding the usage of this platform.</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
