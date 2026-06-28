import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Plus, Settings, LogOut, ArrowLeft,
  MessageSquare, Award, Sparkles, LayoutGrid, Monitor, HelpCircle,
  CreditCard, Lock, ArrowUpRight, Database, Calendar, Flame,
  CheckCircle, ChevronDown, ChevronRight, Pencil, Trash2,
  FileText, BookOpen, Globe, Clock, BarChart3,
  Folder, FolderOpen, PlayCircle, X, Brain, Target, Maximize2, Search
} from 'lucide-react';
import './Sidebar.css';
import { API_BASE_URL } from '../config/api';

export default function Sidebar({ user, selectedSessionId, onSelectChat, onLogout, userTrack, setUserTrack, activeView, setActiveView, activeLearnChapter, setActiveLearnChapter }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // My Learning State (Compact Space-Saving Design)
  const [learnSubject, setLearnSubject] = useState('Physics');
  const [learnClass, setLearnClass] = useState('Class 11');

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev);
    } else {
      setExpanded(prev => !prev);
    }
  };

  const fetchHistory = React.useCallback(async () => {
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
  }, [user?.id]);

  const fetchTokenUsage = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/usage/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.total_token !== undefined) {
          setTotalTokens(data.total_token);
        }
      }
    } catch (err) {
      console.error('Failed to fetch token usage in sidebar:', err);
    }
  }, [user?.id]);

  const fetchUserActivity = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/activity/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        const activity = data.activity || [];
        
        let totalTokens = 0;
        let inputTokens = 0;
        let outputTokens = 0;
        let chatMode = 0;
        let examMode = 0;
        let quizMode = 0;
        
        const dateCounts = {};
        
        activity.forEach(row => {
          totalTokens += row.total_token || 0;
          inputTokens += row.input_tokens || 0;
          outputTokens += row.output_tokens || 0;
          
          if (row.chat_type === 'exam') examMode += row.total_token || 0;
          else if (row.chat_type === 'quiz') quizMode += row.total_token || 0;
          else chatMode += row.total_token || 0;

          if (row.created_at) {
            const d = new Date(row.created_at);
            const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          }
        });
        
        setHeatmapData(dateCounts);
        
        const activeDates = Object.keys(dateCounts).sort();
        const activeDaysCount = activeDates.length;
        
        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate = null;
        
        activeDates.forEach(dateStr => {
          const date = new Date(dateStr);
          if (!lastDate) {
            currentStreak = 1;
          } else {
            const diffTime = Math.abs(date - lastDate);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              currentStreak++;
            } else if (diffDays > 1) {
              currentStreak = 1;
            }
          }
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
          lastDate = date;
        });
        
        const totalMinutes = Math.floor(totalTokens / 1000);
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeUsageStr = `${hours}h ${mins}m`;
        
        setDashboardStats({
          timeUsageStr,
          activeDays: activeDaysCount,
          maxStreak,
          totalSubmissions: activity.length
        });

        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const dailyAvg = totalTokens / Math.max(1, activeDaysCount);
        const currentMonthTokens = activity
            .filter(r => new Date(r.created_at).getMonth() === now.getMonth() && new Date(r.created_at).getFullYear() === now.getFullYear())
            .reduce((acc, r) => acc + (r.total_token || 0), 0);
        const monthDailyAvg = currentMonthTokens / Math.max(1, currentDay);
        const forecast = currentMonthTokens + (monthDailyAvg * (daysInMonth - currentDay));

        setTokenAnalytics({
          inputTokens,
          outputTokens,
          chatMode,
          examMode,
          quizMode,
          dailyAvg: Math.round(dailyAvg),
          forecast: Math.round(forecast)
        });
      }
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    }
  }, [user?.id]);

  const getPlanDescription = () => {
    const limit = 40000;
    const pct = (totalTokens / limit) * 100;
    if (pct <= 25) return 'Free';
    if (pct <= 50) return 'Low';
    if (pct <= 75) return 'Medium';
    return 'High';
  };

  useEffect(() => {
    fetchHistory();
    fetchTokenUsage();
    fetchUserActivity();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);

    const handleToggle = () => {
      if (window.innerWidth <= 768) {
        setMobileOpen(prev => !prev);
      } else {
        setExpanded(prev => !prev);
      }
    };
    window.addEventListener('toggleSidebar', handleToggle);

    const handleRefresh = () => {
      fetchHistory();
      fetchTokenUsage();
    };
    window.addEventListener('refreshChatList', handleRefresh);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggleSidebar', handleToggle);
      window.removeEventListener('refreshChatList', handleRefresh);
    };
  }, [fetchHistory, fetchTokenUsage]);


  
  const [dashboardStats, setDashboardStats] = useState({
    timeUsageStr: '0h 0m',
    activeDays: 0,
    maxStreak: 0,
    totalSubmissions: 0
  });
  
  const [tokenAnalytics, setTokenAnalytics] = useState({
    inputTokens: 0,
    outputTokens: 0,
    chatMode: 0,
    examMode: 0,
    quizMode: 0,
    dailyAvg: 0,
    forecast: 0
  });
  
  const [heatmapData, setHeatmapData] = useState({});

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
            onSelectChat(data.chat.id || data.chat.chat_id);
            fetchHistory();
        }
    } catch (err) {
        console.error('Failed to start new chat', err);
    }
  };

  // Settings state & logic
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('evolve-theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('evolve-accent') || 'indigo');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [activeStatIndex, setActiveStatIndex] = useState(0);
  
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) setIsMonthOpen(false);
      if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // fetchTokenUsage moved up

  useEffect(() => {
    if (showSettings) {
      fetchTokenUsage();
    }
  }, [showSettings, fetchTokenUsage]);

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('evolve-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const applyAccent = (color) => {
    setAccentColor(color);
    localStorage.setItem('evolve-accent', color);
    const accents = {
      indigo: '#818cf8',
      blue: '#60a5fa',
      emerald: '#34d399',
      rose: '#fb7185',
      amber: '#fbbf24',
      violet: '#a78bfa',
    };
    document.documentElement.style.setProperty('--accent-brand', accents[color] || accents.indigo);
  };

  const getDynamicChartData = () => {
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];
    
    // Generate the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = monthsList[d.getMonth()];
      const isCurrent = i === 0;
      result.push({
        month: mName,
        used: isCurrent ? totalTokens : 0,
        limit: 40000
      });
    }
    return result;
  };

  const categories = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'account', label: 'Account', icon: <HelpCircle size={18} /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} /> }
  ];

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'dashboard':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Dashboard & Usage</h3>
            <div className="pane-section">
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Token Capacity</div>
                   <div className="settings-form-label-desc">{totalTokens.toLocaleString()} of 40,000 Limit</div>
                 </div>
                 <div className="settings-avatar" style={{ background: 'transparent', width: 'auto', color: '#8b5cf6' }}>
                   {Math.round((totalTokens / 40000) * 100)}% Used
                 </div>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Concept Mastery</div>
                   <div className="settings-form-label-desc">Top 12% of students</div>
                 </div>
                 <div className="settings-avatar" style={{ background: 'transparent', width: 'auto', color: '#10b981' }}>
                   84%
                 </div>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Active Days</div>
                   <div className="settings-form-label-desc">Consistent study schedule</div>
                 </div>
                 <div className="settings-avatar" style={{ background: 'transparent', width: 'auto', color: '#34d399' }}>
                   {dashboardStats.activeDays} days
                 </div>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Max Streak</div>
                   <div className="settings-form-label-desc">Longest learning streak</div>
                 </div>
                 <div className="settings-avatar" style={{ background: 'transparent', width: 'auto', color: '#f87171' }}>
                   {dashboardStats.maxStreak} days
                 </div>
              </div>
            </div>

          </div>
        );

      case 'general':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Preferences</h3>
            <div className="pane-section">
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Appearance</div>
                 </div>
                 <select className="settings-form-select">
                   <option>System default</option>
                   <option>Dark mode</option>
                   <option>Light mode</option>
                 </select>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Chat font</div>
                 </div>
                 <select className="settings-form-select">
                   <option>Inter (Default)</option>
                   <option>Roboto</option>
                   <option>Monospace</option>
                 </select>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Motion</div>
                 </div>
                 <select className="settings-form-select">
                   <option>Enabled</option>
                   <option>Reduced</option>
                 </select>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Launch at Login</div>
                 </div>
                 <div className="flex-row items-center gap-2">
                   <span style={{ color: '#fff', fontSize: '0.9rem' }}>On</span>
                   <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                 </div>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Subscription</h3>
            <div className="pane-section">
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Current Plan</div>
                   <div className="settings-form-label-desc">Evolve Free - Included for all users</div>
                 </div>
                 <button className="settings-form-select" disabled>Manage plan</button>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Available Upgrade</div>
                   <div className="settings-form-label-desc">Evolve Pro - $15/month</div>
                 </div>
                 <button className="settings-form-select" style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}>Upgrade</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Profile</h3>
            <div className="pane-section">
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Avatar</div>
                 </div>
                 <div className="settings-avatar">
                   {(user?.username || user?.userId || 'V').substring(0, 1).toUpperCase()}
                 </div>
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Full name</div>
                 </div>
                 <input type="text" className="settings-form-input" defaultValue={user?.username || 'Vijay'} />
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">What should we call you?</div>
                 </div>
                 <input type="text" className="settings-form-input" defaultValue={user?.username || 'Vijay'} />
              </div>
              <div className="settings-form-row">
                 <div className="flex-col">
                   <div className="settings-form-label">Which curriculum/exam are you studying for?</div>
                 </div>
                 <select className="settings-form-select">
                   <option>Select</option>
                   <option>CBSE</option>
                   <option>JEE Main / Advanced</option>
                   <option>NEET</option>
                   <option>Other</option>
                 </select>
              </div>
            </div>
            
            <h3 className="pane-title" style={{ marginTop: '40px' }}>Instructions for AI</h3>
            <p className="settings-form-label-desc" style={{ marginBottom: '16px' }}>The AI will keep these in mind across chats and sessions.</p>
            <textarea 
              className="settings-form-input" 
              style={{ width: '100%', height: '100px', resize: 'none' }} 
              placeholder="e.g. I am a high school senior studying AP Calculus. I prefer step-by-step explanations."
            ></textarea>
          </div>
        );
    }
  };


  return (
    <>
      {/* Mobile backdrop - closes drawer on tap. Always rendered; shown/hidden via CSS opacity+visibility */}
      <div
        className={`mobile-sidebar-backdrop ${isMobile && mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />


      <aside 
        className={`gemini-sidebar flex-col justify-between ${expanded ? 'expanded' : 'collapsed'} ${isMobile && mobileOpen ? 'mobile-open expanded' : ''}`}
        onMouseEnter={() => { if (!isMobile) setExpanded(true); }}
        onMouseLeave={() => { if (!isMobile) setExpanded(false); }}
      >
        {/* showExpanded = true on desktop when expanded, always true inside mobile drawer */}
        {(() => {
          const showExpanded = expanded || (isMobile && mobileOpen);
          return (<>
          <div className="sidebar-top flex-col" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div className="sidebar-header">
              <button
                className="icon-btn menu-btn"
                onClick={isMobile ? () => setMobileOpen(false) : toggleSidebar}
                title={isMobile ? 'Close menu' : (expanded ? 'Collapse menu' : 'Expand menu')}
              >
                {isMobile ? <ArrowLeft size={20} /> : <Menu size={20} className={expanded ? 'rotate-icon' : ''} />}
              </button>
               {showExpanded && (
                 <h1 className="sidebar-title animate-fadeIn">
                   Evolve <span className="gm-bold">GM</span>
                 </h1>
               )}
            </div>

              {showExpanded ? (
                <div className="sidebar-modes-segmented animate-fadeIn" style={{ 
                  position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 6px', padding: '12px 8px', margin: '12px 8px',
                  background: 'rgba(20, 20, 25, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px'
                }}>
                  <button 
                    onClick={() => setActiveView('learn')}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: activeView === 'learn' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer',
                      background: activeView === 'learn' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: activeView === 'learn' ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeView === 'learn' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.2s ease', fontWeight: activeView === 'learn' ? 600 : 500
                    }}
                  >
                    <BookOpen size={15} strokeWidth={2} />
                    <span style={{ fontSize: '0.75rem' }}>Learn</span>
                  </button>

                  <button 
                    onClick={() => setActiveView('ask')}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: activeView === 'ask' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer',
                      background: activeView === 'ask' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: activeView === 'ask' ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeView === 'ask' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.2s ease', fontWeight: activeView === 'ask' ? 600 : 500
                    }}
                  >
                    <MessageSquare size={15} strokeWidth={2} />
                    <span style={{ fontSize: '0.75rem' }}>Ask</span>
                  </button>

                  <button 
                    onClick={() => setActiveView('plan')}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: activeView === 'plan' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer',
                      background: activeView === 'plan' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: activeView === 'plan' ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeView === 'plan' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.2s ease', fontWeight: activeView === 'plan' ? 600 : 500
                    }}
                  >
                    <Calendar size={15} strokeWidth={2} />
                    <span style={{ fontSize: '0.75rem' }}>Plan</span>
                  </button>

                  <button 
                    onClick={() => setActiveView('practice')}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: activeView === 'practice' ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer',
                      background: activeView === 'practice' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: activeView === 'practice' ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeView === 'practice' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                      transition: 'all 0.2s ease', fontWeight: activeView === 'practice' ? 600 : 500
                    }}
                  >
                    <Award size={15} strokeWidth={2} />
                    <span style={{ fontSize: '0.75rem' }}>Practice</span>
                  </button>

                  {/* Center Home Button */}
                  <button 
                    onClick={() => setActiveView('home')}
                    title="Home Dashboard"
                    style={{ 
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '38px', height: '38px', borderRadius: '10px', border: '1px solid', borderColor: activeView === 'home' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', cursor: 'pointer',
                      background: activeView === 'home' ? 'rgba(255,255,255,0.15)' : 'rgba(30, 30, 35, 1)',
                      color: activeView === 'home' ? '#fff' : 'var(--text-primary)',
                      boxShadow: activeView === 'home' ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 5px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease', zIndex: 10
                    }}
                  >
                    <LayoutGrid size={18} strokeWidth={activeView === 'home' ? 2 : 1.5} />
                  </button>
                </div>
              ) : (
                <div className="flex-col items-center animate-fadeIn" style={{ gap: '14px', padding: '16px 0', width: '100%' }}>
                  <button onClick={() => setActiveView('home')} title="Home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeView === 'home' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', color: activeView === 'home' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <LayoutGrid size={22} />
                  </button>
                  <button onClick={() => setActiveView('learn')} title="Learn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeView === 'learn' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', color: activeView === 'learn' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <BookOpen size={22} />
                  </button>
                  <button onClick={() => setActiveView('ask')} title="Ask" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeView === 'ask' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', color: activeView === 'ask' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <MessageSquare size={22} />
                  </button>
                  <button onClick={() => setActiveView('plan')} title="Plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeView === 'plan' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', color: activeView === 'plan' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Calendar size={22} />
                  </button>
                  <button onClick={() => setActiveView('practice')} title="Practice" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeView === 'practice' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '10px', color: activeView === 'practice' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Award size={22} />
                  </button>
                </div>
              )}

            {(activeView === 'ask' || activeView === 'practice') && (
              <div className="new-chat-wrapper">
                {activeView === 'ask' && (
                  <button className="new-chat-btn animate-fadeIn" title="New Chat" onClick={handleNewChat}>
                    <Plus size={18} className="plus-icon" />
                    {showExpanded && <span className="nav-label">New chat</span>}
                  </button>
                )}

                {activeView === 'practice' && (
                  <button className="new-chat-btn animate-fadeIn" title="Start Quiz" onClick={() => alert('Starting a randomized diagnostic practice session.')}>
                    <Plus size={18} className="plus-icon" />
                    {showExpanded && <span className="nav-label">Start quiz</span>}
                  </button>
                )}
              </div>
            )}

            <nav className={`nav-menu flex-col w-full ${showAllHistory ? 'scrollable-menu custom-scrollbar' : ''}`}>
               {activeView === 'ask' && (
                 <>
                   {showExpanded && history.length > 0 && <div className="recent-label">Recent Chats</div>}
                   {displayedHistory.map((chat) => (
                     <div 
                        key={chat.id} 
                        className={`nav-item history-item ${selectedSessionId === chat.session_id ? 'active' : ''}`} 
                        title={chat.title} 
                        onClick={() => { if (editingId !== chat.id) { onSelectChat(chat.session_id); if (isMobile) setMobileOpen(false); } }}
                     >
                       <div className="history-content flex-row items-center w-full">
                         {chat.chat_type === 'exam' ? (
                           <Award size={18} strokeWidth={1.5} className="history-icon" style={{ color: '#f59e0b' }} />
                         ) : chat.chat_type === 'solve' ? (
                           <Sparkles size={18} strokeWidth={1.5} className="history-icon" style={{ color: '#d946ef' }} />
                         ) : (
                           <MessageSquare size={18} strokeWidth={1.5} className="history-icon" />
                         )}
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
                       
                       {showExpanded && editingId !== chat.id && (
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
                   {showExpanded && history.length > 3 && (
                     <button className="show-more-btn" onClick={() => setShowAllHistory(!showAllHistory)}>
                       {showAllHistory ? 'Show less' : 'Show more'}
                     </button>
                   )}
                 </>
               )}
               {activeView === 'home' && showExpanded && (
                  <div className="sidebar-quests-container animate-fadeIn" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Reminders / Smart Tasks - Gaming Style */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 4px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                       <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#b900ff', textTransform: 'uppercase', letterSpacing: '0.15em', textShadow: '0 0 8px rgba(185, 0, 255, 0.6)' }}>Active Quests</span>
                       <button onClick={() => setShowQuestsModal(true)} style={{ background: 'transparent', border: 'none', color: '#b900ff', cursor: 'pointer', display: 'flex', padding: '2px', borderRadius: '4px', transition: 'all 0.2s', opacity: 0.8 }} className="task-card-hover" title="Expand Quests">
                         <Maximize2 size={12} />
                       </button>
                     </div>
                     
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(10, 10, 15, 0.6)', border: '1px solid rgba(185, 0, 255, 0.2)', borderLeft: '3px solid #b900ff', borderRadius: '4px', transition: 'all 0.2s ease', boxShadow: 'inset 20px 0 30px -20px rgba(185, 0, 255, 0.2)' }} className="task-card-hover">
                       <CheckCircle size={14} style={{ color: '#b900ff', filter: 'drop-shadow(0 0 4px #b900ff)' }} />
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                         <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, textShadow: '0 0 4px rgba(255,255,255,0.3)' }}>Start Chapter 1</span>
                         <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Physics - Units & Measurement</span>
                       </div>
                     </div>

                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(10, 10, 15, 0.6)', border: '1px solid rgba(0, 243, 255, 0.2)', borderLeft: '3px solid #00f3ff', borderRadius: '4px', transition: 'all 0.2s ease', boxShadow: 'inset 20px 0 30px -20px rgba(0, 243, 255, 0.2)' }} className="task-card-hover">
                       <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '2px solid #00f3ff', filter: 'drop-shadow(0 0 4px #00f3ff)' }} />
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                         <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, textShadow: '0 0 4px rgba(255,255,255,0.3)' }}>Start Chapter 2</span>
                         <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Chemistry - Structure of Atom</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
                {activeView === 'learn' && (
                 <>
                   {/* My Learning Tree */}
                   {showExpanded && (
                     <>
                       <div className="sidebar-section-header animate-fadeIn mt-2">
                         <span className="section-header-title-small">My Learning</span>
                       </div>
                       
                       <div className="learn-compact-container" style={{ padding: '0 4px' }}>
                         {/* Subject Selector */}
                         <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', marginBottom: '8px' }}>
                           {['Physics', 'Chemistry', 'Mathematics'].map(subj => (
                             <button 
                               key={subj}
                               onClick={() => setLearnSubject(subj)}
                               style={{ flex: 1, padding: '6px 0', fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px', 
                               background: learnSubject === subj ? 'rgba(251, 191, 36, 0.12)' : 'transparent', 
                               color: learnSubject === subj ? '#FBBF24' : 'var(--text-muted)' }}
                             >
                               {subj === 'Mathematics' ? 'Math' : subj}
                             </button>
                           ))}
                         </div>
                         
                         {/* Class Selector */}
                         <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', marginBottom: '12px' }}>
                           {['Class 11', 'Class 12'].map(cls => (
                             <button 
                               key={cls}
                               onClick={() => setLearnClass(cls)}
                               style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', 
                               background: learnClass === cls ? 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' : 'transparent', 
                               color: learnClass === cls ? '#111' : 'var(--text-muted)',
                               boxShadow: learnClass === cls ? '0 0 12px rgba(217, 119, 6, 0.5)' : 'none' }}
                             >
                               {cls}
                             </button>
                           ))}
                         </div>

                         {/* Chapter List (Scrollable) */}
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '40vh', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                           {[...Array(15)].map((_, i) => (
                             <div 
                               key={i} 
                               className="folder-node recording-node" 
                               onClick={() => setActiveLearnChapter({ subject: learnSubject, chapter: `Chapter ${i + 1}` })}
                               style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                             >
                               <div className="folder-row">
                                 <PlayCircle size={14} className="recording-icon" style={{ color: '#FBBF24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                    <span className="folder-label truncate" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>Chapter {i + 1}</span>
                                    <span className="truncate" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{learnSubject} Core Topic {i + 1}</span>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </>
                   )}
                 </>
               )}

               {activeView === 'practice' && (
                 <>
                   {showExpanded && (
                     <div className="sidebar-section-header animate-fadeIn">
                       <span className="section-header-title-small">Testing Modes</span>
                     </div>
                   )}
                   <div className="nav-item practice-nav-item">
                     <Award size={18} className="history-icon" />
                     <span className="nav-label">Daily Challenge</span>
                   </div>
                   <div className="nav-item practice-nav-item">
                     <Clock size={18} className="history-icon" />
                     <span className="nav-label">Mock Exam Series</span>
                   </div>
                   <div className="nav-item practice-nav-item">
                     <BarChart3 size={18} className="history-icon" />
                     <span className="nav-label">Chapter Analytics</span>
                   </div>

                   {showExpanded && <div className="recent-label animate-fadeIn">Completed Tests</div>}
                   <div className="nav-item history-item">
                     <CheckCircle size={18} style={{ color: '#10b981' }} />
                     <span className="nav-label truncate">{userTrack} Physics Quiz 1</span>
                   </div>
                   <div className="nav-item history-item">
                     <CheckCircle size={18} style={{ color: '#10b981' }} />
                     <span className="nav-label truncate">Chemical Bonding Practice</span>
                   </div>
                 </>
               )}
            </nav>
          </div>

          {/* Sidebar blur overlay when dropdown open */}
          {showProfileDropdown && (
            <div className="sidebar-profile-blur-overlay" onClick={() => setShowProfileDropdown(false)} />
          )}

          {/* Redesigned Premium Profile Footer */}
          <div className="sidebar-profile-wrapper">
            {showExpanded ? (
              <div className={`pf-card ${showProfileDropdown ? 'pf-card--open' : ''}`} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                <div className="pf-accent-bar" />
                <div className="pf-inner">
                  <div className="pf-avatar-ring">
                    <div className="pf-avatar-ring__spin" />
                    <div className="pf-avatar-core">
                      {user?.username?.substring(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="pf-info">
                    <span className="pf-name">{user?.username}</span>
                    <span className="pf-plan-pill" data-plan={getPlanDescription().toLowerCase()}>
                      <span className="pf-plan-dot" />
                      {getPlanDescription()} Plan
                    </span>
                  </div>
                  <ChevronDown size={14} className={`pf-chevron ${showProfileDropdown ? 'pf-chevron--up' : ''}`} />
                </div>
              </div>
            ) : (
              /* Collapsed: click avatar to EXPAND sidebar */
              <div className="pf-collapsed" onClick={() => { setExpanded(true); }}>
                <div className="pf-avatar-ring">
                  <div className="pf-avatar-ring__spin" />
                  <div className="pf-avatar-core">
                    {user?.username?.substring(0, 1).toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            {showProfileDropdown && showExpanded && (
              <div className="profile-dropdown-menu animate-slideUp">
                <button className="dropdown-item" onClick={() => { setShowSettings(true); setShowProfileDropdown(false); }}>
                  <Settings size={14} style={{ marginRight: '8px' }} /> Settings
                </button>
                <button className="dropdown-item danger" onClick={() => { onLogout(); setShowProfileDropdown(false); }}>
                  <LogOut size={14} style={{ marginRight: '8px' }} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </>);
        })()}
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay flex-row items-center justify-center">
          <div className="settings-modal flex-row">
             <button className="settings-close-btn" onClick={() => setShowSettings(false)}><X size={24} /></button>
             <div className="settings-sidebar flex-col">
                <div className="settings-search-wrapper">
                   <Search size={16} className="settings-search-icon" />
                   <input type="text" placeholder="Search" />
                </div>
                <h3>Settings</h3>
                <nav className="settings-nav flex-col">
                   {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        className={`settings-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                   ))}
                </nav>
             </div>
             <div className="settings-main-content">
                {renderCategoryContent()}
             </div>
          </div>
        </div>
      )}

      {/* Compact Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay flex-row items-center justify-center" onClick={() => setDeletingId(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={22} />
            </div>
            <h2 className="delete-modal-title">Delete chat?</h2>
            <p className="delete-modal-desc">This will permanently delete this conversation.</p>
            <div className="delete-modal-actions">
              <button className="delete-modal-cancel" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="delete-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Quests Modal */}
      {showQuestsModal && (
        <div className="quests-modal-overlay flex-row items-center justify-center" onClick={() => setShowQuestsModal(false)}>
          <div className="quests-modal" onClick={e => e.stopPropagation()}>
            <div className="quests-modal-header flex-row items-center justify-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <Target size={26} style={{ color: '#b900ff' }} />
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Quests</h2>
              </div>
              <button className="icon-btn" onClick={() => setShowQuestsModal(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>
            
            <div className="quests-modal-content custom-scrollbar">
               {/* Quest 1 */}
               <div className="quest-list-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(10, 10, 15, 0.6)', border: '1px solid rgba(185, 0, 255, 0.2)', borderLeft: '3px solid #b900ff', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                 <CheckCircle size={18} style={{ color: '#b900ff', filter: 'drop-shadow(0 0 4px #b900ff)' }} />
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>Start Chapter 1</span>
                   <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Physics - Units & Measurement</span>
                 </div>
               </div>

               {/* Quest 2 */}
               <div className="quest-list-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(10, 10, 15, 0.6)', border: '1px solid rgba(0, 243, 255, 0.2)', borderLeft: '3px solid #00f3ff', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                 <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #00f3ff', boxShadow: '0 0 6px #00f3ff' }}></div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                   <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>Start Chapter 2</span>
                   <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Chemistry - Structure of Atom</span>
                 </div>
               </div>
               
            </div>
          </div>
        </div>
      )}
    </>
  );
}

