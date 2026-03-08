import React from 'react';
import './TreeLogo.css';

export default function TreeLogo({ size = 32 }) {
  return (
    <div className="elegant-tree-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="treeGradient" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#B000FF" />
          </linearGradient>
        </defs>
        
        {/* Elegant Abstract Tree Structure */}
        <path 
          d="M50 90 C 50 60, 40 40, 25 25" 
          stroke="url(#treeGradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="tree-branch b1"
        />
        <path 
          d="M50 90 C 50 50, 70 30, 85 35" 
          stroke="url(#treeGradient)" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="tree-branch b2"
        />
        <path 
          d="M50 90 C 45 65, 30 50, 15 55" 
          stroke="url(#treeGradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="tree-branch b3"
        />
        <path 
          d="M50 80 C 60 55, 75 45, 90 60" 
          stroke="url(#treeGradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="tree-branch b4"
        />
        <path 
          d="M50 95 L50 10" 
          stroke="url(#treeGradient)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          className="tree-trunk main-trunk"
        />
        
        {/* Minimalist Floating Nodes / Leaves */}
        <circle cx="25" cy="25" r="3" fill="#00E5FF" className="tree-node n1" />
        <circle cx="85" cy="35" r="3" fill="#B000FF" className="tree-node n2" />
        <circle cx="15" cy="55" r="2.5" fill="#00E5FF" className="tree-node n3" />
        <circle cx="90" cy="60" r="2.5" fill="#B000FF" className="tree-node n4" />
        <circle cx="50" cy="10" r="4" fill="#FFFFFF" className="tree-node n5" />
      </svg>
    </div>
  );
}
