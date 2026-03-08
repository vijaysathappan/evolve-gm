import React from 'react';
import Header from '../components/Header';
import LeftPanel from '../components/LeftPanel';
import CenterPanel from '../components/CenterPanel';
import RightPanel from '../components/RightPanel';
import '../App.css';

export default function LearnNotebook() {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  );
}
