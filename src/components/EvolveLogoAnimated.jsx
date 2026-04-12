import React from 'react';
import BookLogo from './BookLogo';
import './EvolveLogoAnimated.css';

/**
 * EvolveLogoAnimated — wraps BookLogo with a breathing glow when the sidebar is expanded.
 */
export default function EvolveLogoAnimated({ size = '28px', expanded = false, className = '' }) {
  return (
    <span className={`evolve-logo-wrap ${expanded ? 'evolve-logo--expanded' : ''} ${className}`}>
      <BookLogo size={size} />
    </span>
  );
}
