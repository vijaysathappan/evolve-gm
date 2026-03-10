import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPad from './components/MainPad';
import Auth from './pages/Auth';
import './index.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <>
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden" style={{ display: 'flex' }}>
        <MainPad user={user} onLogout={handleLogout} />
      </div>
    </>
  );
}

export default App;
