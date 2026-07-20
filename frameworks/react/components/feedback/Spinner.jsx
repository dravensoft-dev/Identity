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

/* Diameters as CSS lengths, not numbers: a JS map reached through member
 * access is invisible to check-dimension-literals, which is how 14/20/32 sat
 * here after every other size map in the layer had been tokenized. `sm` is
 * --icon-sm exactly, and means it — a spinner at that size sits inline with
 * control text, which is the role the icon family names. `md` and `lg` read
 * the spacing scale rather than --avatar-*: those are the avatar's diameters,
 * and a spinner borrowing one would tie its size to a change meant for
 * avatars. */
const SIZES = { sm: 'var(--icon-sm)', md: 'var(--sp-5)', lg: 'var(--sp-8)' };
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
