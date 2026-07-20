import React, { useEffect } from 'react';

/* Keyframes cannot be expressed in an inline style object, so the animation
 * ships as a <style> tag injected once — the pattern ProgressBar establishes.
 * Reduced motion SLOWS the spin rather than stopping it (as Skeleton does): a
 * frozen spinner reads as a hung process, which is the opposite of the truth. */
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

const SIZES = { sm: 14, md: 20, lg: 32 };
/* Shares `accent` and `gold` with ProgressBar (same tokens). `neutral` and
 * `on-accent` are spinner-only. ProgressBar's status tones are deliberately
 * absent: an indeterminate wait has no state to report, and a spinner tinted
 * --danger would read as a failure that has not happened. */
const TONES = {
  accent: 'var(--crimson)',
  gold: 'var(--gold)',
  neutral: 'var(--mute)',
  'on-accent': 'var(--on-accent)',
};

export function Spinner({ size = 'md', tone = 'accent', label = 'Loading', style, ...rest }) {
  useSpinKeyframes();
  const d = SIZES[size] || SIZES.md;
  const color = TONES[tone] || TONES.accent;
  return (
    <span role="status" aria-label={label} style={{ display: 'inline-flex', color, ...style }} {...rest}>
      <span className="arena-spinner" aria-hidden="true" style={{
        width: d, height: d, boxSizing: 'border-box',
        border: 'var(--bw-strong) solid currentColor', borderTopColor: 'transparent',
        borderRadius: '50%', display: 'inline-block',
      }} />
    </span>
  );
}
