import React from 'react';

const DNALogo = ({ size = "3.5rem", className = "" }) => {
  return (
    <div className={`dna-container ${className}`} style={{ width: size, height: size }}>
      <div className="dna">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="dna-strand" style={{ '--i': i }}>
            <div className="dna-dot dot-1"></div>
            <div className="dna-line"></div>
            <div className="dna-dot dot-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DNALogo;
