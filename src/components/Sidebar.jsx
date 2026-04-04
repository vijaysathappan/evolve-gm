import React, { useState, useEffect } from 'react';
import { Menu, Plus, MessageSquare, Settings, HelpCircle, X, Shield, Lock, FileText, Share2, Trash2, CreditCard, Pencil, ChevronDown } from 'lucide-react';
import BookLogo from './BookLogo';
import './Sidebar.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function Sidebar({ user, selectedSessionId, onSelectChat, onLogout, userTrack, setUserTrack }) {
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  const toggleSidebar = () => setExpanded(!expanded);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chat/list/${user.id}`);
      const data = await resp.json();
      if (data.chats) {
          setHistory(data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch sidebar history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
    const handleToggle = () => setExpanded(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    window.addEventListener('refreshChatList', fetchHistory); // Global refresh trigger
    return () => {
        window.removeEventListener('toggleSidebar', handleToggle);
        window.removeEventListener('refreshChatList', fetchHistory);
    };
  }, [user?.id]);

  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = async (id, oldTitle) => {
    if (editingId === id) {
        // Save state
        const sanitizedTitle = newTitle.trim();
        if (!sanitizedTitle || sanitizedTitle === oldTitle) {
            setEditingId(null);
            return;
        }

        console.log(`[SIDEBAR] Renaming session ${id} to "${sanitizedTitle}"`);

        try {
            const resp = await fetch(`${API_BASE_URL}/api/chat/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: id, title: sanitizedTitle })
            });

            if (resp.ok) {
                console.log('[SIDEBAR] Rename successful');
                await fetchHistory(); // Wait for actual data refresh from DB
            } else {
                const errData = await resp.json();
                console.error('[SIDEBAR] Rename failed backend:', errData.error);
                alert(`Rename failed: ${errData.error || 'Server error'}`);
            }
        } catch (err) {
            console.error('[SIDEBAR] Renaming error:', err);
            alert('Could not reach server to rename chat.');
        }
        setEditingId(null);
    } else {
        // Start editing state
        setEditingId(id);
        setNewTitle(oldTitle);
    }
  };

  const displayedHistory = showAllHistory ? history : history.slice(0, 10);

  const [deletingId, setDeletingId] = useState(null);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
        const resp = await fetch(`${API_BASE_URL}/api/chat/${deletingId}`, {
            method: 'DELETE'
        });
        
        if (resp.ok) {
            if (selectedSessionId === deletingId) {
                onSelectChat(null);
            }
            await fetchHistory();
        } else {
            alert("Failed to delete the conversation from the server.");
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert("Operation failed. Could not reach server to delete chat.");
    } finally {
        setDeletingId(null);
    }
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleNewChat = async () => {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/chat/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const data = await resp.json();
        if (data.chat) {
            // Important: resetting the selected session to the brand new one
            onSelectChat(data.chat.id || data.chat.chat_id);
            fetchHistory();
        }
    } catch (err) {
        console.error('Failed to start new chat', err);
    }
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
            <button className="new-chat-btn" title="New Chat" onClick={handleNewChat}>
              <Plus size={20} className="plus-icon" />
              <span className="nav-label">New chat</span>
            </button>
          </div>

          <nav className={`nav-menu flex-col w-full ${showAllHistory ? 'scrollable-menu custom-scrollbar' : ''}`}>
             {expanded && history.length > 0 && <div className="recent-label">Recent</div>}
             
             {/* Chat History items */}
             {displayedHistory.map((chat) => (
               <div 
                  key={chat.id} 
                  className={`nav-item history-item ${selectedSessionId === chat.session_id ? 'active' : ''}`} 
                  title={chat.title} 
                  onClick={() => editingId !== chat.id && onSelectChat(chat.session_id)}
                >
                 <div className="history-content flex-row items-center w-full">
                   <MessageSquare size={18} strokeWidth={1.5} className="history-icon" />
                   {editingId === chat.id ? (
                       <input 
                         className="rename-input" 
                         value={newTitle}
                         autoFocus
                         onChange={(e) => setNewTitle(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id, chat.title)}
                         onBlur={() => handleRename(chat.id, chat.title)}
                         onClick={(e) => e.stopPropagation()}
                       />
                   ) : (
                       <span className="nav-label truncate">{chat.title}</span>
                   )}
                 </div>
                 
                 {expanded && editingId !== chat.id && (
                   <div className="history-actions flex-row items-center">
                      <button className="context-btn" onClick={(e) => { e.stopPropagation(); handleRename(chat.id, chat.title); }} title="Rename session">
                        <Pencil size={14} />
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
                <div className="setting-card flex-col">
                  <div 
                    className="flex-row items-center justify-between w-full cursor-pointer"
                    onClick={() => setShowPlanOptions(!showPlanOptions)}
                  >
                    <div className="flex-row items-center gap-3">
                      <CreditCard size={24} className="setting-icon"/>
                      <span className="setting-title">Subscription Plan</span>
                    </div>
                    <ChevronDown size={18} style={{ transform: showPlanOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                  </div>
                  
                  {showPlanOptions && (
                    <div className="plan-grid mt-4 animate-fadeIn">
                      <div className={`plan-item ${userTrack === 'JEE' ? 'active' : ''}`} onClick={() => setUserTrack('JEE')}>
                        <div className="plan-name">JEE (Free)</div>
                        <div className="plan-price">Included</div>
                        <div className="plan-tokens">10k tokens /mo</div>
                      </div>
                      <div className={`plan-item ${userTrack === 'NEET' ? 'active' : ''}`} onClick={() => setUserTrack('NEET')}>
                        <div className="plan-name">NEET (Free)</div>
                        <div className="plan-price">Included</div>
                        <div className="plan-tokens">10k tokens /mo</div>
                      </div>
                      <div className={`plan-item pro-gradient ${userTrack === 'JEE' ? 'active' : ''}`} onClick={() => setUserTrack('JEE')}>
                        <div className="plan-name">JEE (Pro)</div>
                        <div className="plan-price">$15 /mo</div>
                        <div className="plan-tokens">5M tokens /mo</div>
                      </div>
                      <div className={`plan-item pro-gradient ${userTrack === 'NEET' ? 'active' : ''}`} onClick={() => setUserTrack('NEET')}>
                        <div className="plan-name">NEET (Pro)</div>
                        <div className="plan-price">$20 /mo</div>
                        <div className="plan-tokens">5M tokens /mo</div>
                      </div>
                    </div>
                  )}
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

      {/* Simple & Clean Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay flex-row items-center justify-center">
          <div className="settings-modal flex-col" style={{ width: '320px', padding: '24px', textAlign: 'center' }}>
             <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Delete chat?</h2>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                This will permanently delete this conversation.
             </p>
             <div className="flex-row gap-3" style={{ justifyContent: 'center' }}>
                <button 
                  className="cancel-btn" 
                  onClick={() => setDeletingId(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  className="danger-btn" 
                  onClick={confirmDelete}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#ef4444' }}
                >
                  Delete
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
