import React from 'react';

export default function BrainBulbLogo({ className = '', style = {}, size = "3rem", color = "#c7d2fe" }) {
  return (
    <svg 
      className={className} 
      style={{ ...style, width: size, height: size, flexShrink: 0 }} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bulb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8C0FF" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      
      <g stroke="url(#bulb-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Right side: Brain concentric arcs */}
        <path d="M 52 20 L 52 75" />
        <path d="M 52 20 A 27.5 27.5 0 0 1 52 75" />
        <path d="M 52 27 A 20.5 20.5 0 0 1 52 68" />
        <path d="M 52 34 A 13.5 13.5 0 0 1 52 61" />
        <path d="M 52 41 A 6.5 6.5 0 0 1 52 54" />

        {/* Left side: Bulb outline */}
        <path d="M 48 20 C 20 20, 15 50, 27 65 C 33 72, 43 75, 48 75" />

        {/* Left side inner filament loop */}
        <path d="M 45 75 C 45 60, 30 60, 32 48 C 34 38, 43 40, 43 46 C 43 50, 38 52, 38 55" />

        {/* Base of the bulb */}
        <path d="M 40 81 L 60 81" />
        <path d="M 42 87 L 58 87" />
        <path d="M 45 93 L 55 93" />
      </g>

      {/* Radiating Rays (thicker for a drop effect) */}
      <g stroke="url(#bulb-gradient)" strokeWidth="4" strokeLinecap="round">
        <line x1="50" y1="11" x2="50" y2="4" />
        <line x1="26" y1="23" x2="19" y2="16" />
        <line x1="13" y1="47.5" x2="5" y2="47.5" />
        <line x1="26" y1="72" x2="19" y2="79" />
        <line x1="74" y1="23" x2="81" y2="16" />
        <line x1="87" y1="47.5" x2="95" y2="47.5" />
        <line x1="74" y1="72" x2="81" y2="79" />
      </g>

      {/* Center Orange Dot */}
      <circle cx="48" cy="58" r="5" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.5))' }} />
    </svg>
  );
}
