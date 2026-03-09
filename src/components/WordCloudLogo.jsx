import React from 'react';

export default function WordCloudLogo({ className = '', style = {}, size = "3rem" }) {
  return (
    <svg 
      className={className} 
      style={{ ...style, width: size, height: size, flexShrink: 0 }} 
      viewBox="0 0 110 120" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8C0FF" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#3f2b96" />
        </linearGradient>
      </defs>
      
      <g fill="url(#brand-gradient)" fontFamily="ui-rounded, 'SF Compact Rounded', system-ui, sans-serif">
        
        {/* Top Arc */}
        <text x="55" y="16" textAnchor="middle" fontSize="14" fontWeight="800">DISCOVER</text>
        
        {/* Curves */}
        <text x="18" y="28" transform="rotate(-35, 18, 28)" textAnchor="middle" fontSize="10" fontWeight="800">READ</text>
        <text x="92" y="28" transform="rotate(35, 92, 28)" textAnchor="middle" fontSize="10" fontWeight="800">CREATE</text>
        
        {/* Upper middle */}
        <text x="55" y="34" textAnchor="middle" fontSize="19" fontWeight="900" letterSpacing="-0.5">KNOWLEDGE</text>
        
        {/* Equator (wide) */}
        {/* FOCUS on the left edge */}
        <text x="8" y="55" transform="rotate(-90, 8, 55)" textAnchor="middle" fontSize="11" fontWeight="800" fill="#A8C0FF">FOCUS</text>
        
        <text x="26" y="52" textAnchor="end" fontSize="12" fontWeight="800">LEARN</text>
        <text x="55" y="54" textAnchor="middle" fontSize="24" fontWeight="900" letterSpacing="-1" fill="#ffffff" style={{ textShadow: '0px 0px 8px rgba(129, 140, 248, 0.5)' }}>EVOLVE</text>
        <text x="84" y="52" textAnchor="start" fontSize="12" fontWeight="800">THINK</text>

        {/* SOLVE on the right edge */}
        <text x="102" y="55" transform="rotate(90, 102, 55)" textAnchor="middle" fontSize="11" fontWeight="800" fill="#A8C0FF">SOLVE</text>
        
        {/* Lower middle */}
        <text x="55" y="72" textAnchor="middle" fontSize="18" fontWeight="900" letterSpacing="-0.5">QUESTION</text>
        
        {/* Bottom Arc of bulb */}
        <text x="49" y="87" textAnchor="end" fontSize="13" fontWeight="800">STUDY</text>
        <text x="61" y="87" textAnchor="start" fontSize="13" fontWeight="800">GROW</text>

        {/* Base screw */}
        <text x="55" y="103" textAnchor="middle" fontSize="16" fontWeight="900" fill="#818cf8">LOGIC</text>
        <text x="55" y="116" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5c65c0">IDEAS</text>
      </g>
    </svg>
  );
}
