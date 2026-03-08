import React from 'react';
import Sidebar from '../components/Sidebar';
import MainPad from '../components/MainPad';

export default function ChatMode() {
  return (
    <div className="chat-layout-wrapper" style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-app)' }}>
      <Sidebar />
      <div className="flex-1 overflow-hidden" style={{ display: 'flex', position: 'relative' }}>
        <MainPad />
      </div>
    </div>
  );
}
