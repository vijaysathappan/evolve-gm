import React, { useEffect, useState } from 'react';
import { Gift, X, Sparkles, Coins } from 'lucide-react';
import './DailyRewardModal.css';

const DailyRewardModal = ({ tokens, onClose }) => {
  const [animState, setAnimState] = useState('hidden'); // hidden -> pop -> glow -> idle

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimState('pop'), 100);
    const timer2 = setTimeout(() => setAnimState('glow'), 800);
    const timer3 = setTimeout(() => setAnimState('idle'), 1500);

    // Auto close after 5 seconds if not interacted with
    const closeTimer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className="reward-overlay">
      <div className={`reward-modal anim-${animState}`}>
        <button className="reward-close" onClick={onClose}><X size={20} /></button>
        
        <div className="reward-icon-container">
          <div className="reward-glow-bg"></div>
          <Coins size={64} className="reward-chest-icon" />
          <Sparkles size={24} className="reward-sparkle s1" />
          <Sparkles size={24} className="reward-sparkle s2" />
          <Sparkles size={16} className="reward-sparkle s3" />
        </div>

        <h2 className="reward-title">Daily Login Streak!</h2>
        <p className="reward-subtitle">You've earned bonus tokens for coming back today.</p>

        <div className="reward-amount-box">
          <span className="plus">+</span>
          <span className="amount">{tokens.toLocaleString()}</span>
          <span className="label">Tokens</span>
        </div>

        <button className="reward-claim-btn" onClick={onClose}>
          Claim Reward
        </button>
      </div>
      
      {/* Confetti particles */}
      {animState === 'pop' && (
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className={`confetti-particle c-${i % 5}`} style={{
              '--tx': `${(Math.random() - 0.5) * 300}px`,
              '--ty': `${(Math.random() - 0.5) * 300 - 100}px`,
              '--rot': `${Math.random() * 360}deg`,
              '--delay': `${Math.random() * 0.2}s`
            }}></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyRewardModal;
