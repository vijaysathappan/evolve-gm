import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainPad from './components/MainPad';
import Auth from './pages/Auth';
import LearnDashboard from './pages/LearnDashboard';
import PracticeDashboard from './pages/PracticeDashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [userTrack, setUserTrack] = useState('JEE');
  const [activeView, setActiveView] = useState('home'); // 'home' | 'ask' | 'learn' | 'practice' | 'plan'
  const [activeLearnChapter, setActiveLearnChapter] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.chat_id) {
        setSelectedSessionId(userData.chat_id);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedSessionId(null);
  };

  const handleSelectChat = (sessionId) => {
    setSelectedSessionId(sessionId);
  };
  // ── Apply saved personalization on every app load ──────────────────
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('evolve-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Accent color
    const accentMap = {
      indigo:  '#818cf8',
      blue:    '#60a5fa',
      emerald: '#34d399',
      rose:    '#fb7185',
      amber:   '#fbbf24',
      violet:  '#a78bfa',
    };
    const savedAccent = localStorage.getItem('evolve-accent') || 'indigo';
    const hex = accentMap[savedAccent] || accentMap.indigo;
    document.documentElement.style.setProperty('--accent-brand', hex);
  }, []);

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Helper function to render active main panel
  const renderMainContent = () => {
    switch (activeView) {
      case 'learn':
        return <LearnDashboard user={user} activeLearnChapter={activeLearnChapter} setActiveLearnChapter={setActiveLearnChapter} />;
      case 'practice':
        return <PracticeDashboard user={user} userTrack={userTrack} />;
      case 'ask':
      case 'plan':
      case 'home':
      case 'chat':
      default:
        return (
          <MainPad 
              user={user} 
              userTrack={userTrack}
              selectedSessionId={selectedSessionId} 
              onSelectChat={handleSelectChat}
              onLogout={handleLogout} 
              activeView={activeView}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      <Sidebar 
        user={user} 
        userTrack={userTrack}
        setUserTrack={setUserTrack}
        selectedSessionId={selectedSessionId} 
        onSelectChat={handleSelectChat} 
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        activeLearnChapter={activeLearnChapter}
        setActiveLearnChapter={setActiveLearnChapter}
      />
      <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderMainContent()}
      </div>
    </div>
  );
}

export default App;
