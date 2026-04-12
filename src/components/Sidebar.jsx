import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Plus, MessageSquare, Settings, HelpCircle, X, Shield, Lock, FileText, Share2, Trash2, CreditCard, Pencil, ChevronDown,
  Bell, Monitor, Database, Heart, Globe, Type, Languages, Info, ArrowUpRight, CheckCircle, Smartphone, LogOut, ArrowLeft,
  LayoutGrid, Clock, Flame, Calendar, BarChart3
} from 'lucide-react';
import './Sidebar.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function Sidebar({ user, selectedSessionId, onSelectChat, onLogout, userTrack, setUserTrack }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(window.innerWidth > 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev);
    } else {
      setExpanded(prev => !prev);
    }
  };

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
    window.addEventListener('refreshChatList', fetchHistory);
    return () => {
      window.removeEventListener('resize', handleResize);
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

  const tokenData = [
    { month: 'Oct', used: 2100, limit: 10000 },
    { month: 'Nov', used: 4800, limit: 10000 },
    { month: 'Dec', used: 7200, limit: 10000 },
    { month: 'Jan', used: 3100, limit: 10000 },
    { month: 'Feb', used: 5500, limit: 10000 },
    { month: 'Mar', used: 9100, limit: 10000 },
    { month: 'Apr', used: 1000, limit: 10000 },
  ];

  const categories = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'token-usage', label: 'Token Usage', icon: <Database size={18} /> },
    { id: 'personalization', label: 'Personalization', icon: <Monitor size={18} /> },
    { id: 'account', label: 'Account', icon: <HelpCircle size={18} /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} /> }
  ];

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'dashboard':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Dashboard</h3>
            
            <div className="dashboard-stats-grid carousel-mode">
              <button 
                className="carousel-nav-btn prev" 
                onClick={() => setActiveStatIndex((prev) => (prev > 0 ? prev - 1 : 2))}
              >
                <ArrowLeft size={18} />
              </button>

              <div className="dash-stat-carousel-viewport">
                <div 
                  className="dash-stat-carousel-track" 
                  style={{ transform: `translateX(-${activeStatIndex * 100}%)` }}
                >
                  <div className="dash-stat-card">
                    <div className="dash-stat-header">
                      <Clock size={16} className="dash-stat-icon time" />
                      <span>Total Time Usage</span>
                    </div>
                    <div className="dash-stat-value">0h 0m</div>
                    <div className="dash-stat-sub">Starting today</div>
                  </div>
                  
                  <div className="dash-stat-card">
                    <div className="dash-stat-header">
                      <Calendar size={16} className="dash-stat-icon days" />
                      <span>Total Active Days</span>
                    </div>
                    <div className="dash-stat-value">0</div>
                    <div className="dash-stat-sub">Across 1 month</div>
                  </div>
                  
                  <div className="dash-stat-card">
                    <div className="dash-stat-header">
                      <Flame size={16} className="dash-stat-icon streak" />
                      <span>Max Streak</span>
                    </div>
                    <div className="dash-stat-value">0</div>
                    <div className="dash-stat-sub">Current: 0 days</div>
                  </div>
                </div>
              </div>

              <button 
                className="carousel-nav-btn next" 
                onClick={() => setActiveStatIndex((prev) => (prev < 2 ? prev + 1 : 0))}
              >
                <ArrowUpRight size={18} style={{ transform: 'rotate(45deg)' }} /> 
              </button>
            </div>

            <div className="carousel-dots flex-row justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className={`carousel-dot ${activeStatIndex === i ? 'active' : ''}`} />
              ))}
            </div>

            <div className="heatmap-container">
              <div className="heatmap-header flex-row items-center justify-between">
                <div className="flex-col">
                  <div className="heatmap-title">Activity Breakdown</div>
                  <div className="heatmap-summary flex-row gap-4">
                    <span>0 submissions in {selectedMonth} {selectedYear}</span>
                  </div>
                </div>
                
                <div className="heatmap-filters flex-row gap-2">
                  <div className="custom-dropdown-container" ref={monthRef}>
                    <button 
                      className={`custom-dash-select ${isMonthOpen ? 'active' : ''}`}
                      onClick={() => setIsMonthOpen(!isMonthOpen)}
                    >
                      <span>{selectedMonth}</span>
                      <ChevronDown size={14} className={`select-arrow ${isMonthOpen ? 'rotated' : ''}`} />
                    </button>
                    
                    {isMonthOpen && (
                      <div className="custom-dropdown-menu custom-scrollbar animate-slideUp">
                        {['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                          <div 
                            key={m} 
                            className={`dropdown-option ${selectedMonth === m ? 'selected' : ''}`}
                            onClick={() => { setSelectedMonth(m); setIsMonthOpen(false); }}
                          >
                            {m === 'All' ? 'All Months' : m}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="custom-dropdown-container" ref={yearRef}>
                    <button 
                      className={`custom-dash-select ${isYearOpen ? 'active' : ''}`}
                      onClick={() => setIsYearOpen(!isYearOpen)}
                    >
                      <span>{selectedYear}</span>
                      <ChevronDown size={14} className={`select-arrow ${isYearOpen ? 'rotated' : ''}`} />
                    </button>
                    
                    {isYearOpen && (
                      <div className="custom-dropdown-menu animate-slideUp">
                        {[0, 1, 2].map(offset => {
                          const year = (new Date().getFullYear() - offset).toString();
                          return (
                            <div 
                              key={year} 
                              className={`dropdown-option ${selectedYear === year ? 'selected' : ''}`}
                              onClick={() => { setSelectedYear(year); setIsYearOpen(false); }}
                            >
                              {year}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="heatmap-scroll-area custom-scrollbar">
                <div className="heatmap-grid-wrapper">
                  <div className="heatmap-labels-y">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </div>
                  <div className="heatmap-grid" style={{ gap: '14px', alignItems: 'flex-start' }}>
                    {(() => {
                      const monthsList = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                      const yearNum = parseInt(selectedYear);
                      
                      return monthsList.map((monthName) => {
                        const mIdx = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
                        if (selectedMonth !== 'All' && selectedMonth !== monthName) return null;
                        
                        const daysInMonth = new Date(yearNum, mIdx + 1, 0).getDate();
                        const cols = Math.ceil(daysInMonth / 7);
                        
                        return (
                          <div key={monthName} className="heatmap-month-group flex-col" style={{ gap: '8px' }}>
                            <div className="heatmap-month-block flex-row" style={{ gap: '4px' }}>
                              {[...Array(cols)].map((_, colIndex) => (
                                <div key={colIndex} className="heatmap-column">
                                  {[...Array(7)].map((_, rowIndex) => {
                                    const dayIdx = colIndex * 7 + rowIndex;
                                    if (dayIdx >= daysInMonth) return <div key={rowIndex} className="heatmap-cell-empty" />;
                                    
                                    const intensity = 0;
                                    return (
                                      <div 
                                        key={rowIndex} 
                                        className={`heatmap-cell level-${intensity}`}
                                        title={`${monthName} ${dayIdx + 1}: Level ${intensity}`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                            <span className="heatmap-month-label">{monthName}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <div className="heatmap-legend flex-row items-center gap-2">
                <span>Less</span>
                <div className="heatmap-cell level-0" />
                <div className="heatmap-cell level-1" />
                <div className="heatmap-cell level-2" />
                <div className="heatmap-cell level-3" />
                <div className="heatmap-cell level-4" />
                <span>More</span>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">General</h3>
            <div className="pane-section">
              <div className="promo-banner flex-row items-center justify-between">
                <div className="flex-row items-center gap-4">
                  <div className="promo-icon-bg"><Lock size={20} /></div>
                  <div className="flex-col">
                    <span className="promo-title">Secure your account</span>
                    <span className="promo-desc">Add MFA to protect your account when logging in.</span>
                  </div>
                </div>
                <button className="promo-btn">Set up MFA</button>
              </div>
              <div className="settings-row flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="row-label">App updates</span>
                  <span className="row-desc">Current version: 1.2024.5</span>
                </div>
                <button className="row-action-btn">Check for updates</button>
              </div>
              <div className="settings-row flex-row items-center justify-between">
                <span className="row-label">Launch at Login</span>
                <div className="flex-row items-center gap-2">
                  <span className="row-status">On</span>
                  <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'token-usage': {
        const maxUsed = Math.max(...tokenData.map(d => d.used));
        const currentMonth = tokenData[tokenData.length - 1];
        const totalUsed = tokenData.reduce((s, d) => s + d.used, 0);
        const avgUsed = Math.round(totalUsed / tokenData.length);
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Token Usage</h3>
            <div className="token-stats-row flex-row gap-4" style={{ marginBottom: '28px' }}>
              <div className="token-stat-card flex-col">
                <span className="tsc-label">This Month</span>
                <span className="tsc-value">{currentMonth.used.toLocaleString()}</span>
                <span className="tsc-sub">{Math.round(currentMonth.used / currentMonth.limit * 100)}% of limit</span>
              </div>
              <div className="token-stat-card flex-col">
                <span className="tsc-label">Monthly Avg</span>
                <span className="tsc-value">{avgUsed.toLocaleString()}</span>
                <span className="tsc-sub">over 7 months</span>
              </div>
              <div className="token-stat-card flex-col">
                <span className="tsc-label">Plan Limit</span>
                <span className="tsc-value">10,000</span>
                <span className="tsc-sub">tokens / mo</span>
              </div>
            </div>

            <div className="token-chart-wrap">
              <div className="token-chart-label-row flex-row items-center justify-between" style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Breakdown</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limit: 10,000 tokens</span>
              </div>
              <div className="token-bar-chart flex-row items-end gap-3">
                {tokenData.map((d) => {
                  const pct = d.used / d.limit * 100;
                  const barColor = pct < 50 ? '#10b981' : pct < 80 ? '#f59e0b' : '#ef4444';
                  const barHeight = Math.max((d.used / maxUsed) * 140, 8);
                  return (
                    <div key={d.month} className="tok-bar-col flex-col items-center gap-2">
                      <span className="tok-bar-pct" style={{ color: barColor }}>{Math.round(pct)}%</span>
                      <div className="tok-bar-track">
                        <div
                          className="tok-bar-fill"
                          style={{ height: `${barHeight}px`, background: barColor, boxShadow: `0 0 12px ${barColor}55` }}
                        />
                      </div>
                      <span className="tok-bar-label">{d.month}</span>
                      <span className="tok-bar-val">{(d.used / 1000).toFixed(1)}k</span>
                    </div>
                  );
                })}
              </div>
              <div className="tok-legend flex-row items-center gap-4" style={{ marginTop: '20px' }}>
                <span className="tok-leg-item" style={{ color: '#10b981' }}>● Under 50%</span>
                <span className="tok-leg-item" style={{ color: '#f59e0b' }}>● 50–80%</span>
                <span className="tok-leg-item" style={{ color: '#ef4444' }}>● Over 80%</span>
              </div>
            </div>
          </div>
        );
      }

      case 'personalization':
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Personalization</h3>
            <div className="pane-section">
              <div className="settings-row flex-col" style={{ gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '24px' }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <span className="row-label">Theme</span>
                  <span className="row-desc">Choose how Evolve GM looks for you.</span>
                </div>
                <div className="theme-option-row flex-row gap-3">
                  {['dark', 'light', 'midnight'].map(t => (
                    <button
                      key={t}
                      className={`theme-option-btn ${theme === t ? 'active' : ''}`}
                      onClick={() => applyTheme(t)}
                    >
                      <div className={`theme-preview theme-preview-${t}`}></div>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', marginTop: '8px' }}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row flex-col" style={{ gap: '16px', alignItems: 'flex-start' }}>
                <div className="flex-col" style={{ gap: '4px' }}>
                  <span className="row-label">Accent Color</span>
                  <span className="row-desc">Customize highlights and interactive elements.</span>
                </div>
                <div className="accent-swatch-row flex-row gap-3 flex-wrap">
                  {[
                    { name: 'indigo', color: '#818cf8' },
                    { name: 'blue', color: '#60a5fa' },
                    { name: 'emerald', color: '#34d399' },
                    { name: 'rose', color: '#fb7185' },
                    { name: 'amber', color: '#fbbf24' },
                    { name: 'violet', color: '#a78bfa' },
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      className={`accent-swatch ${accentColor === name ? 'active' : ''}`}
                      style={{ background: color, boxShadow: accentColor === name ? `0 0 0 3px #fff, 0 0 0 5px ${color}` : 'none' }}
                      onClick={() => applyAccent(name)}
                      title={name}
                    />
                  ))}
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
              <div className="current-plan-card flex-row items-center justify-between" style={{ marginBottom: '24px' }}>
                <div className="flex-col">
                  <span className="plan-badge">CURRENT PLAN</span>
                  <h4 className="plan-headline">Evolve Free</h4>
                  <p className="plan-subline">Included for all users</p>
                </div>
                <button className="plan-manage-btn" disabled>Manage plan</button>
              </div>
              <div className="plan-comparison-grid flex-row gap-4">
                <div className="comp-card flex-col flex-1">
                  <span className="comp-name">Evolve Free</span>
                  <ul className="comp-features">
                    <li><CheckCircle size={14} className="check-icon" /> 10k monthly tokens</li>
                    <li><CheckCircle size={14} className="check-icon" /> Standard speed</li>
                    <li><CheckCircle size={14} className="check-icon" /> Basic web search</li>
                  </ul>
                  <button className="comp-btn current">Your current plan</button>
                </div>
                <div className="comp-card pro flex-col flex-1">
                  <div className="pro-label">MOST POPULAR</div>
                  <span className="comp-name">Evolve Pro</span>
                  <div className="comp-price">$15 <span className="price-term">/month</span></div>
                  <ul className="comp-features">
                    <li><CheckCircle size={14} className="check-icon" /> 5M monthly tokens</li>
                    <li><CheckCircle size={14} className="check-icon" /> Ultra-fast response</li>
                    <li><CheckCircle size={14} className="check-icon" /> Academic DB access</li>
                    <li><CheckCircle size={14} className="check-icon" /> Image generation</li>
                  </ul>
                  <button className="comp-btn upgrade">Upgrade to Pro</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="settings-pane animate-fadeIn">
            <h3 className="pane-title">Account</h3>
            <div className="acct-profile-card">
              <div className="acct-avatar">{user?.username?.substring(0, 2).toUpperCase()}</div>
              <div className="acct-identity">
                <span className="acct-name">{user?.username}</span>
                <span className="acct-email">{user?.email || '—'}</span>
              </div>
            </div>
            <div className="pane-section">
              <div className="settings-row flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="row-label">Full Name</span>
                  <span className="row-desc">{user?.username}</span>
                </div>
              </div>
              <div className="settings-row flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="row-label">User ID</span>
                  <span className="row-desc" style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{user?.userId || user?.id}</span>
                </div>
              </div>
              <div className="settings-row flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="row-label">Email Address</span>
                  <span className="row-desc">{user?.email || 'Not set'}</span>
                </div>
              </div>
              <div className="settings-row flex-row items-center justify-between">
                <div className="flex-col">
                  <span className="row-label">Plan</span>
                  <span className="row-desc">Evolve Free</span>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', background: 'rgba(129,140,248,0.15)', color: '#818cf8', fontWeight: 700 }}>FREE</span>
              </div>
            </div>
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


      <aside className={`gemini-sidebar flex-col justify-between ${expanded ? 'expanded' : 'collapsed'} ${isMobile && mobileOpen ? 'mobile-open expanded' : ''}`}>
        {/* showExpanded = true on desktop when expanded, always true inside mobile drawer */}
        {(() => {
          const showExpanded = expanded || (isMobile && mobileOpen);
          return (<>
          <div className="sidebar-top flex-col">
            <div className="sidebar-header">
              <div className="sidebar-logo-container flex-row items-center gap-3">
                {showExpanded && (
                  <h1 className="sidebar-title">
                    Evolve <span className="gm-bold">GM</span>
                  </h1>
                )}
              </div>

              <button
                className="icon-btn menu-btn"
                onClick={isMobile ? () => setMobileOpen(false) : toggleSidebar}
                title={isMobile ? 'Close menu' : (expanded ? 'Collapse menu' : 'Expand menu')}
              >
                {isMobile ? <ArrowLeft size={20} /> : <Menu size={20} />}
              </button>
            </div>

            <div className="new-chat-wrapper">
              <button className="new-chat-btn" title="New Chat" onClick={handleNewChat}>
                <Plus size={18} className="plus-icon" />
                {showExpanded && <span className="nav-label">New chat</span>}
              </button>
            </div>

            <nav className={`nav-menu flex-col w-full ${showAllHistory ? 'scrollable-menu custom-scrollbar' : ''}`}>
               {showExpanded && history.length > 0 && <div className="recent-label">Recent</div>}
               
               {/* Chat History items */}
               {displayedHistory.map((chat) => (
                 <div 
                    key={chat.id} 
                    className={`nav-item history-item ${selectedSessionId === chat.session_id ? 'active' : ''}`} 
                    title={chat.title} 
                    onClick={() => { if (editingId !== chat.id) { onSelectChat(chat.session_id); if (isMobile) setMobileOpen(false); } }}
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
             <button className="nav-item sidebar-signout-nav" onClick={onLogout} title="Sign Out">
               <LogOut size={20} className="history-icon" />
               <span className="nav-label">Sign Out</span>
             </button>
          </div>
        </>);
        })()}
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay flex-row items-center justify-center">
          <div className="settings-modal flex-row">
             <div className="settings-sidebar flex-col">
                <div className="modal-header flex-row items-center justify-between">
                   <h2>Settings</h2>
                   <button className="icon-btn" onClick={() => setShowSettings(false)}><X size={20} /></button>
                </div>
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
    </>
  );
}

