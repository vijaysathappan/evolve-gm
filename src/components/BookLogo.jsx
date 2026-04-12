import React, { useId } from 'react';

/**
 * BookLogo — Google-G-inspired "E" for Evolve GM.
 *
 * Geometry:
 *   • Outer circular arc (radius 42) forms the CURVED LEFT SPINE of the E
 *   • Three horizontal bars extend to the right (x → 82)
 *   • Two rectangular gaps separate the three bars
 *   • Even-odd fill rule makes the gaps transparent holes
 *
 * Colour layout (mirrors Google's G quadrant logic):
 *   Red    — top  bar + upper spine  (energy)
 *   Yellow — thin upper-left wedge   (optimism, small like G's yellow)
 *   Green  — lower-left spine arc    (growth)
 *   Blue   — middle/bottom bars      (trust, largest section)
 *
 * All colour sections are clipped to the E path with slanted diagonal
 * transitions for the same "sense of movement" as the Google G.
 */
export default function BookLogo({ className = '', style = {}, size = '3rem' }) {
  // Unique clip-path ID — avoids DOM id conflicts when used multiple times
  const uid  = useId();
  const clip = `eg${uid}`;

  // ── E path parameters ──────────────────────────────────────────────────
  // Center (cx,cy)=50,50 | outer arc radius R=42 | bar right edge xR=82
  // At y=12 & y=88 (both 38px from cy):  x_outer = 50−√(42²−38²) = 50−18 = 32
  // Bar/gap heights: 3 bars × 16px + 2 gaps × 14px = 48+28 = 76 → y: 12–88
  //   top bar  y 12–28 | gap1 y 28–42 | mid bar y 42–58 | gap2 y 58–72 | bot bar y 72–88

  const eClipPath = [
    // ── Outer boundary (clockwise) ────────────────────────────────
    'M 82 12',               // top-right corner of top bar
    'L 32 12',               // left along top-bar top to outer arc
    'A 42 42 0 1 1 32 88',  // outer arc: large-arc=1, sweep=1 (CW, via leftmost point)
    'L 82 88',               // right along bottom-bar bottom
    'Z',                     // implied line up right edge → back to M 82 12
    // ── Gap 1 hole (same CW winding → even-odd = transparent) ────
    'M 30 28 L 82 28 L 82 42 L 30 42 Z',
    // ── Gap 2 hole ────────────────────────────────────────────────
    'M 30 58 L 82 58 L 82 72 L 30 72 Z',
  ].join(' ');

  return (
    <svg
      className={className}
      style={{ ...style, width: size, height: size, flexShrink: 0 }}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Evolve GM Logo"
    >
      <defs>
        {/* E shape clip-path with even-odd rule (gaps become holes) */}
        <clipPath id={clip}>
          <path d={eClipPath} fillRule="evenodd" />
        </clipPath>

        {/* Subtle drop-shadow for depth when used on light surfaces */}
        <filter id={`${clip}sh`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── Dark rounded-square card (matches app dark background) ── */}
      <rect
        x="2" y="2" width="96" height="96" rx="20"
        fill="#0D0D0F"
        stroke="rgba(255,255,255,0.045)"
        strokeWidth="1"
      />

      {/* ── Four-colour E, all clipped to E shape ── */}
      {/*
          Paint order (bottom → top):
            1. Blue  — base, fills everything
            2. Green — lower-left arc section (painted over blue)
            3. Yellow— upper-left thin wedge  (painted over green edge)
            4. Red   — top section            (painted over yellow/green)
          Diagonal polygon edges create the Google-G "slanted transition" effect.
      */}
      <g clipPath={`url(#${clip})`} filter={`url(#${clip}sh)`}>

        {/* ① Blue — entire E (base layer, dominant in middle/bottom bars) */}
        <rect x="0" y="0" width="100" height="100" fill="#4285F4" />

        {/* ② Green — lower-left spine arc section
              Diagonal top edge: (0,52)→(50,50) slants toward centre
              Diagonal bot edge: (0,80)→(46,76) tapers away               */}
        <polygon
          points="0,52  50,50  46,76  0,80"
          fill="#34A853"
        />

        {/* ③ Yellow — thin upper-left wedge (intentionally small, like Google G)
              Sandwiched between the red diagonal below it and green above     */}
        <polygon
          points="0,28  42,36  50,50  0,52"
          fill="#FBBC05"
        />

        {/* ④ Red — top section: covers top bar + upper spine arc
              Bottom boundary is a slanted diagonal (not horizontal) for movement:
                far-left at y=28, slopes to y=38 at x=58, y=44 at x=100           */}
        <polygon
          points="0,0  100,0  100,44  58,38  42,36  0,28"
          fill="#EA4335"
        />

        {/* Subtle glass sheen on upper-half */}
        <rect x="0" y="0" width="100" height="50" fill="white" fillOpacity="0.04" />
      </g>

      {/* ── Rounded card top highlight ("glass" effect) ── */}
      <rect
        x="2" y="2" width="96" height="38" rx="20"
        fill="white" fillOpacity="0.035"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  );
}
