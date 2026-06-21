import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Plus, Settings, LogOut, ArrowLeft,
  MessageSquare, Award, Sparkles, LayoutGrid, Monitor, HelpCircle,
  CreditCard, Lock, ArrowUpRight, Database, Calendar, Flame,
  CheckCircle, ChevronDown, ChevronRight, Pencil, Trash2,
  FileText, BookOpen, Globe, Clock, BarChart3,
  Folder, FolderOpen, PlayCircle, X
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
  const [totalTokens, setTotalTokens] = useState(0);

  // My Learning Folder Tree state
  const [expandedNodes, setExpandedNodes] = useState({ 'my-learning': true });
  
  const toggleNode = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

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
            
            <div className="dashboard-stats-grid bento-grid">
              
              <div className="dash-stat-card bento-wide" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)', borderColor: 'rgba(99,102,241,0.2)' }}>
                <div className="dash-stat-header flex-row items-center justify-between w-full">
                  <div className="flex-row items-center gap-2">
                    <Database size={16} className="dash-stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.2)' }} />
                    <span style={{ fontWeight: 600, color: '#fff' }}>Token Capacity</span>
                  </div>
                  <span className="dash-stat-sub" style={{ margin: 0 }}>{Math.round((totalTokens / 40000) * 100)}% Used</span>
                </div>
                
                <div className="usage-progress-bar" style={{ marginTop: '16px', marginBottom: '8px', height: '8px' }}>
                  <div 
                    className="usage-progress-fill" 
                    style={{ width: `${Math.min((totalTokens / 40000) * 100, 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }}
                  ></div>
                </div>
                
                <div className="flex-row items-center justify-between w-full">
                  <div className="dash-stat-value" style={{ fontSize: '1.25rem' }}>{totalTokens.toLocaleString()}</div>
                  <div className="dash-stat-sub">of 40,000 Limit</div>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-header">
                  <Calendar size={16} className="dash-stat-icon days" />
                  <span>Active Days</span>
                </div>
                <div className="dash-stat-value">{dashboardStats.activeDays}</div>
                <div className="dash-stat-sub">Lifetime</div>
              </div>
              
              <div className="dash-stat-card">
                <div className="dash-stat-header">
                  <Flame size={16} className="dash-stat-icon streak" />
                  <span>Max Streak</span>
                </div>
                <div className="dash-stat-value">{dashboardStats.maxStreak}</div>
                <div className="dash-stat-sub">Days</div>
              </div>
            </div>

            <div className="heatmap-container">
              <div className="heatmap-header flex-row items-center justify-between">
                <div className="flex-col">
                  <div className="heatmap-title">Activity Breakdown</div>
                  <div className="heatmap-summary flex-row gap-4">
                    <span>{
                      Object.entries(heatmapData).filter(([dateStr, count]) => {
                        if (selectedMonth === 'All') return dateStr.startsWith(selectedYear);
                        const mIdx = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(selectedMonth);
                        const expectedMonthStr = (mIdx + 1).toString().padStart(2, '0');
                        return dateStr.startsWith(`${selectedYear}-${expectedMonthStr}`);
                      }).reduce((acc, [_, count]) => acc + count, 0)
                    } submissions in {selectedMonth === 'All' ? '' : selectedMonth + ' '}{selectedYear}</span>
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
                                    
                                    const expectedMonthStr = (mIdx + 1).toString().padStart(2, '0');
                                    const expectedDayStr = (dayIdx + 1).toString().padStart(2, '0');
                                    const dateKey = `${yearNum}-${expectedMonthStr}-${expectedDayStr}`;
                                    const count = heatmapData[dateKey] || 0;
                                    
                                    let intensity = 0;
                                    if (count > 0 && count <= 2) intensity = 1;
                                    else if (count > 2 && count <= 5) intensity = 2;
                                    else if (count > 5 && count <= 10) intensity = 3;
                                    else if (count > 10) intensity = 4;
                                    
                                    return (
                                      <div 
                                        key={rowIndex} 
                                        className={`heatmap-cell level-${intensity}`}
                                        title={`${monthName} ${dayIdx + 1}: ${count} submissions`}
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

            <div className="token-chart-wrap analytics-dashboard" style={{ marginTop: '24px' }}>
              <div className="token-chart-label-row flex-row items-center justify-between" style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Advanced Consumption Analytics</span>
              </div>
              
              <div className="analytics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {/* Panel 2: Usage by Mode */}
                <div className="analytics-panel">
                  <div className="analytics-header">
                    <span className="analytics-title">Usage by Mode</span>
                  </div>
                  <div className="mode-bars flex-col gap-3">
                    <div className="mode-bar-row">
                      <div className="mode-label flex-row justify-between"><span>Exams</span> <span>{Math.round((tokenAnalytics.examMode / (totalTokens || 1)) * 100)}%</span></div>
                      <div className="mode-progress"><div className="mode-fill exam-fill" style={{ width: `${(tokenAnalytics.examMode / (totalTokens || 1)) * 100}%` }}></div></div>
                    </div>
                    <div className="mode-bar-row">
                      <div className="mode-label flex-row justify-between"><span>Quizzes</span> <span>{Math.round((tokenAnalytics.quizMode / (totalTokens || 1)) * 100)}%</span></div>
                      <div className="mode-progress"><div className="mode-fill quiz-fill" style={{ width: `${(tokenAnalytics.quizMode / (totalTokens || 1)) * 100}%` }}></div></div>
                    </div>
                    <div className="mode-bar-row">
                      <div className="mode-label flex-row justify-between"><span>Chat & Doubt</span> <span>{Math.round((tokenAnalytics.chatMode / (totalTokens || 1)) * 100)}%</span></div>
                      <div className="mode-progress"><div className="mode-fill chat-fill" style={{ width: `${(tokenAnalytics.chatMode / (totalTokens || 1)) * 100}%` }}></div></div>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Monthly Forecast */}
                <div className="analytics-panel">
                  <div className="analytics-header">
                    <span className="analytics-title">Monthly Forecast</span>
                  </div>
                  <div className="forecast-content flex-col items-center justify-center">
                    <span className="forecast-value">{tokenAnalytics.forecast.toLocaleString()}</span>
                    <span className="forecast-sub">Projected tokens this month</span>
                    <div className="forecast-status" style={{ color: tokenAnalytics.forecast > 40000 ? '#ef4444' : '#10b981', marginTop: '12px', fontWeight: 600 }}>
                      {tokenAnalytics.forecast > 40000 ? 'Warning: Limit Exceeded' : 'On Track'}
                    </div>
                  </div>
                </div>
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
                    <li><CheckCircle size={14} className="check-icon" /> 40k monthly tokens</li>
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
              <div className="acct-avatar">{(user?.username || user?.userId || '??').substring(0, 2).toUpperCase()}</div>
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

            {showExpanded && (
              <div className="sidebar-modes animate-fadeIn">
                <button 
                  className={`sidebar-mode-btn ${activeView === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveView('chat')}
                >
                  Chat
                </button>
                <button 
                  className={`sidebar-mode-btn ${activeView === 'learn' ? 'active' : ''}`}
                  onClick={() => setActiveView('learn')}
                >
                  Learn
                </button>
                <button 
                  className={`sidebar-mode-btn ${activeView === 'practice' ? 'active' : ''}`}
                  onClick={() => setActiveView('practice')}
                >
                  Practice
                </button>
              </div>
            )}

            <div className="new-chat-wrapper">
              {activeView === 'chat' && (
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

            <nav className={`nav-menu flex-col w-full ${showAllHistory ? 'scrollable-menu custom-scrollbar' : ''}`}>
               {activeView === 'chat' && (
                 <>
                   {showExpanded && history.length > 0 && <div className="recent-label">Recent Chats</div>}
                   
                   {/* Chat History items */}
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
                     <button 
                       className="show-more-btn"
                       onClick={() => setShowAllHistory(!showAllHistory)}
                     >
                       {showAllHistory ? 'Show less' : 'Show more'}
                     </button>
                   )}
                 </>
               )}
                {activeView === 'learn' && (
                 <>
                   {/* My Learning Tree */}
                   {showExpanded && (
                     <div className="sidebar-section-header animate-fadeIn mt-2">
                       <span className="section-header-title-small">My Learning</span>
                     </div>
                   )}
                   
                   <div className="folder-tree-container">
                     {/* Root Folder */}
                     <div 
                       className="folder-node" 
                       onClick={(e) => toggleNode('subj-physics', e)}
                     >
                       <div className="folder-row">
                         {expandedNodes['subj-physics'] ? <ChevronDown size={14} className="folder-chevron" /> : <ChevronRight size={14} className="folder-chevron" />}
                         {expandedNodes['subj-physics'] ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}
                         <span className="folder-label">Physics</span>
                       </div>
                     </div>
                     
                     {/* Level 1: Classes */}
                     {expandedNodes['subj-physics'] && (
                       <div className="folder-children">
                         <div className="folder-node" onClick={(e) => toggleNode('phys-c11', e)}>
                           <div className="folder-row">
                             {expandedNodes['phys-c11'] ? <ChevronDown size={14} className="folder-chevron" /> : <ChevronRight size={14} className="folder-chevron" />}
                             {expandedNodes['phys-c11'] ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}
                             <span className="folder-label">Class 11</span>
                           </div>
                         </div>
                         
                         {/* Level 2: Chapters (Click to start teaching) */}
                         {expandedNodes['phys-c11'] && (
                           <div className="folder-children">
                             <div className="folder-node recording-node" onClick={() => setActiveLearnChapter({ subject: 'Physics', chapter: 'Chapter 1: Units and Measurement' })}>
                               <div className="folder-row">
                                 <PlayCircle size={14} className="recording-icon" />
                                 <span className="folder-label truncate">Chapter 1: Units and Measurement</span>
                               </div>
                             </div>
                           </div>
                         )}
                       </div>
                     )}

                     {/* Other Subjects */}
                     <div className="folder-node" onClick={(e) => toggleNode('subj-chem', e)}>
                       <div className="folder-row">
                         {expandedNodes['subj-chem'] ? <ChevronDown size={14} className="folder-chevron" /> : <ChevronRight size={14} className="folder-chevron" />}
                         {expandedNodes['subj-chem'] ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}
                         <span className="folder-label">Chemistry</span>
                       </div>
                     </div>
                     <div className="folder-node" onClick={(e) => toggleNode('subj-math', e)}>
                       <div className="folder-row">
                         {expandedNodes['subj-math'] ? <ChevronDown size={14} className="folder-chevron" /> : <ChevronRight size={14} className="folder-chevron" />}
                         {expandedNodes['subj-math'] ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}
                         <span className="folder-label">Mathematics</span>
                       </div>
                     </div>
                   </div>
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

