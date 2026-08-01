import React, { useEffect } from 'react';

import type { ControlSize, SpinnerTone } from '../../../Api.generated';

export interface SpinnerProps {

  /** Diameter. 'sm' is --icon-sm exactly, so a spinner at that size sits inline with control text. */
  size?: ControlSize;

  /** Colour of the ring. 'on-accent' inside a filled button; 'accent' on a page surface. */
  tone?: SpinnerTone;

  /** Accessible name, announced by the status role. Say what is loading when you can. */
  label?: string;
}


let injected = false;
function useSpinKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-spinner', '');
    s.textContent =
      '@keyframes arena-spinner{to{transform:rotate(360deg)}}' +
      '.arena-spinner{animation:arena-spinner var(--loop-spin) linear infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-spinner{animation-duration:var(--loop-reduced)}}';
    document.head.appendChild(s);
  }, []);
}

const SIZES = { sm: 'var(--icon-sm)', md: 'var(--sp-5)', lg: 'var(--sp-8)' };

const TONES = {
  accent: 'var(--crimson)',
  gold: 'var(--gold)',
  neutral: 'var(--mute)',
  'on-accent': 'var(--on-accent)',
};

export function Spinner({ size = 'md', tone = 'accent', label = 'Loading' }: SpinnerProps) {
  useSpinKeyframes();
  const d = SIZES[size] || SIZES.md;
  const color = TONES[tone] || TONES.accent;
  return (
    <span role="progressbar" aria-live="polite" aria-label={label} style={{ display: 'inline-flex', color }}>
      <span className="arena-spinner" aria-hidden="true" style={{
        width: d, height: d,
        border: 'var(--bw-strong) solid currentColor', borderTopColor: 'transparent',
        borderRadius: '50%', display: 'inline-block',
      }} />
    </span>
  );
}
