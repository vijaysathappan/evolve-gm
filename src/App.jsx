import React from 'react';
import Sidebar from './components/Sidebar';
import MainPad from './components/MainPad';
import './index.css';

function App() {
  return (
    <>
      <Sidebar />
      <div className="flex-1 overflow-hidden" style={{ display: 'flex' }}>
        <MainPad />
      </div>
    </>
  );
}

export default App;
