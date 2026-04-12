import React from 'react';
import './GMLogo.css';

const GMLogo = ({ size = 32, className = '' }) => {
  return (
    <div 
      className={`gm-logo-container ${className}`} 
      style={{ '--logo-size': `${size}px` }}
    >
      <svg 
        viewBox="0 0 100 40" 
        className="gm-logo-svg"
      >
        <defs>
          <linearGradient id="gm-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9933" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#138808" />
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Animated 'G' */}
        <path
          className="gm-path g-path"
          d="M35 10 C25 10, 15 15, 15 25 C15 35, 25 40, 35 40 C45 40, 50 35, 50 30 L50 25 L40 25"
          fill="none"
          stroke="url(#gm-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Animated 'M' */}
        <path
          className="gm-path m-path"
          d="M60 40 L60 10 L75 25 L90 10 L90 40"
          fill="none"
          stroke="url(#gm-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Energy Dots */}
        <circle className="energy-dot dot-1" cx="35" cy="25" r="3" fill="#FF9933" />
        <circle className="energy-dot dot-2" cx="75" cy="25" r="3" fill="#138808" />
      </svg>
    </div>
  );
};

export default GMLogo;
