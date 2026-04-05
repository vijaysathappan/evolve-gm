import React from 'react';

export default function BookLogo({ className = '', style = {}, size = "3rem" }) {
  return (
    <svg 
      className={className} 
      style={{ ...style, width: size, height: size, flexShrink: 0 }} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          @keyframes left-breath {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.1); }
          }
          @keyframes right-breath {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.1); }
          }
          .logo-left { animation: left-breath 3s ease-in-out infinite; transform-origin: center; }
          .logo-right { animation: right-breath 3s ease-in-out infinite both; animation-delay: 0.5s; transform-origin: center; }
        `}
      </style>
      
      {/* Modern High-End Brand Icon */}
      {/* Left Fluid Shape - Blue */}
      <g className="logo-left">
        <path 
          d="M50 20C30 20 15 35 15 55C15 75 30 90 50 90V20Z" 
          fill="url(#blueGrad)" 
        />
        <path 
          d="M45 40C35 40 25 45 25 55" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.3" 
        />
        <path 
          d="M45 60C35 60 25 62 25 70" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.2" 
        />
      </g>

      {/* Right Fluid Shape - Orange */}
      <g className="logo-right">
        <path 
          d="M50 20C70 20 85 35 85 55C85 75 70 90 50 90V20Z" 
          fill="url(#orangeGrad)" 
        />
        <path 
          d="M55 45H75" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.3" 
        />
        <path 
          d="M55 60H70" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.2" 
        />
      </g>

      <defs>
        <linearGradient id="blueGrad" x1="50" y1="20" x2="15" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="orangeGrad" x1="50" y1="20" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
      </defs>
    </svg>
  );
}
