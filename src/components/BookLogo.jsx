import React from 'react';

export default function BookLogo({ className = '', style = {}, size = "3rem", color = "#818cf8" }) {
  const gradientId = React.useMemo(() => `book-grad-${Math.random().toString(36).substr(2, 9)}`, []);

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
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes page-breath {
            0%, 100% { transform: scaleX(1); }
            50% { transform: scaleX(1.02); }
          }
          .logo-float { animation: float 3s ease-in-out infinite; }
          .logo-sparkle { animation: sparkle 2s ease-in-out infinite; transform-origin: center; }
          .logo-breath { animation: page-breath 4s ease-in-out infinite; transform-origin: 50% 50%; }
        `}
      </style>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8C0FF" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      <g className="logo-float">
        {/* Center glowing dot to represent knowledge/light */}
        <circle cx="50" cy="30" r="4" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }} />

        {/* Book geometry */}
        <g stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="logo-breath">
          {/* Central spine line */}
          <path d="M 50 40 L 50 85" strokeWidth="5" />
          
          {/* Left main leaf (cover) */}
          <path d="M 50 82 C 35 85, 20 80, 15 70 L 15 35 C 20 45, 35 48, 50 42" />

          {/* Right main leaf (cover) */}
          <path d="M 50 82 C 65 85, 80 80, 85 70 L 85 35 C 80 45, 65 48, 50 42" />

          {/* Inner pages left */}
          <path d="M 50 72 C 40 73, 25 70, 20 62" strokeWidth="3" opacity="0.8" />
          <path d="M 50 62 C 40 63, 28 60, 24 55" strokeWidth="2" opacity="0.6" />

          {/* Inner pages right */}
          <path d="M 50 72 C 60 73, 75 70, 80 62" strokeWidth="3" opacity="0.8" />
          <path d="M 50 62 C 60 63, 72 60, 76 55" strokeWidth="2" opacity="0.6" />
        </g>

        {/* Floating sparkles/stars above book */}
        <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round">
          <path className="logo-sparkle" style={{ animationDelay: '0s' }} d="M 35 25 L 35 18 M 31.5 21.5 L 38.5 21.5" />
          <path className="logo-sparkle" style={{ animationDelay: '0.5s' }} d="M 65 20 L 65 15 M 62.5 17.5 L 67.5 17.5" opacity="0.7" />
          <path className="logo-sparkle" style={{ animationDelay: '1s' }} d="M 25 40 L 25 36 M 23 38 L 27 38" opacity="0.5" />
          <path className="logo-sparkle" style={{ animationDelay: '0.3s' }} d="M 78 42 L 78 38 M 76 40 L 80 40" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}
