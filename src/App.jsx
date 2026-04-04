import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPad from './components/MainPad';
import Auth from './pages/Auth';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [userTrack, setUserTrack] = useState('JEE');

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

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <Sidebar 
        user={user} 
        userTrack={userTrack}
        setUserTrack={setUserTrack}
        selectedSessionId={selectedSessionId} 
        onSelectChat={handleSelectChat} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 overflow-hidden" style={{ display: 'flex' }}>
        <MainPad 
            user={user} 
            userTrack={userTrack}
            selectedSessionId={selectedSessionId} 
            onLogout={handleLogout} 
        />
      </div>
    </>
  );
}

export default App;
