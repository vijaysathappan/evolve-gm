import React, { useRef } from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import './SpeakingPanel.css';

/**
 * SpeakingPanel – Horizontal teleprompter bar.
 * Controls (right column, top→bottom): Play/Pause → FastForward → Rewind
 * Teleprompter: auto-scrolls so active word stays near top.
 */
export default function SpeakingPanel({
  tickerText,
  tickerWS,
  tickerWE,
  isSpeaking,
  onPlayPause,
  onSkipForward,
  onSkipBackward,
}) {
  const bodyRef = useRef(null);
  const markRef = useRef(null);

  // ── No auto-scroll effect requested ────────────────────────────────


  const safeWS = Math.max(0, tickerWS || 0);
  const safeWE = Math.max(0, tickerWE || 0);

  return (
    <div className="sp-root">

      {/* CENTER: voiceover text */}
      <div className="sp-body" ref={bodyRef}>
        {tickerText ? (
          <p className="sp-ticker">
            <span className="sp-read">{tickerText.slice(0, safeWS)}</span>
            {safeWS > 0 && (
              <mark ref={markRef} className="sp-hl" aria-label="Current word">
                {tickerText.slice(safeWS, safeWE)}
              </mark>
            )}
            <span className="sp-ahead">{tickerText.slice(safeWE)}</span>
          </p>
        ) : (
          <p className="sp-placeholder">▶ Press Play to start the AI explanation…</p>
        )}
      </div>

      {/* RIGHT: Play (top) → >> (mid) → |< (bottom) */}
      <div className="sp-controls">

        {/* TOP — Play / Pause (prominent) */}
        <button
          className="sp-btn sp-btn-play"
          onClick={onPlayPause}
          title={isSpeaking ? 'Pause' : 'Play'}
        >
          {isSpeaking ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>

        {/* MIDDLE — Skip forward 10s */}
        <button
          className="sp-btn sp-btn-speed"
          onClick={() => onSkipForward?.(10)}
          title="Skip forward 10s"
        >
          <FastForward size={14} />
        </button>

        {/* BOTTOM — Skip backward 10s */}
        <button
          className="sp-btn sp-btn-speed"
          onClick={() => onSkipBackward?.(10)}
          title="Skip backward 10s"
        >
          <Rewind size={14} />
        </button>

      </div>
    </div>
  );
}
