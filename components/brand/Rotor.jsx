import React, { useEffect } from 'react';

/* Keyframes cannot be expressed in an inline style object, so the spin ships as
 * a <style> injected once into the head — the pattern ProgressBar establishes.
 * This one carries a class because, unlike Dialog's or Menu's, its reduced-motion
 * variant changes the *duration*, which lives on the animation property and so
 * needs a selector — the same reason Spinner and Skeleton carry theirs.
 * Reduced motion slows the rotation rather than stopping it, as Spinner does:
 * `spin` is for loading and splash surfaces, and a frozen rotor there reads as a
 * hung process rather than a calm one. */
let injected = false;
function useRotorKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-rotor', '');
    s.textContent =
      '@keyframes arena-rotor{to{transform:rotate(360deg)}}' +
      '.arena-rotor-spin{animation:arena-rotor 8s linear infinite;transform-origin:50% 50%}' +
      '@media (prefers-reduced-motion:reduce){.arena-rotor-spin{animation-duration:24s}}';
    document.head.appendChild(s);
  }, []);
}

/** Brand symbol. spin=true loops rotation (use only in loading/splash). */
export function Rotor({ size = 48, color = 'var(--crimson)', spin = false, style, ...rest }) {
  useRotorKeyframes();
  const blade = 'M50 50 L92 64.3 L75.2 75.2 L64.3 92 Z';
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, ...style }} {...rest}>
      <svg viewBox="0 0 100 100" width={size} height={size} fill={color}
        className={spin ? 'arena-rotor-spin' : undefined}>
        <path d={blade} />
        <path d={blade} transform="rotate(120 50 50)" />
        <path d={blade} transform="rotate(240 50 50)" />
      </svg>
    </span>
  );
}
