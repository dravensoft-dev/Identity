import React, { useEffect, useState } from 'react';

/* The loading spin is keyframes, which an inline style object cannot express, so
 * it ships as a <style> injected once into the head — the pattern ProgressBar
 * establishes and Spinner follows. It used to render inline inside every
 * <button>, which duplicated the tag once per instance and leaked the CSS into
 * the button's textContent. Reduced motion slows the spin rather than stopping
 * it, as Spinner does: a frozen spinner reads as a hung process. */
let injected = false;
function useSpinKeyframes() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-button', '');
    s.textContent =
      '@keyframes arena-btn-spin{to{transform:rotate(360deg)}}' +
      '.arena-btn-spin{animation:arena-btn-spin .7s linear infinite}' +
      '@media (prefers-reduced-motion:reduce){.arena-btn-spin{animation-duration:2.4s}}';
    document.head.appendChild(s);
  }, []);
}

/* Heights come from the density tokens, so inside `.arena-compact` the button
 * re-densifies with the rows around it instead of towering over them. */
const SIZES = {
  sm: { padding: '0 calc(var(--sp-1) * 3)', height: 'var(--dz-ctl-h-sm)', fontSize: 'var(--dz-text-md)' },
  md: { padding: '0 calc(var(--sp-1) * 4.5)', height: 'var(--dz-ctl-h)', fontSize: 'var(--dz-text)' },
  lg: { padding: '0 calc(var(--sp-1) * 6.5)', height: 'var(--dz-ctl-h-lg)', fontSize: 'var(--dz-text)' },
};

export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  disabled = false, loading = false, full = false, style, ...rest
}) {
  useSpinKeyframes();
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const s = SIZES[size] || SIZES.md;

  const palettes = {
    primary: {
      bg: hover ? 'var(--crimson-strong)' : 'var(--crimson)',
      color: 'var(--on-accent)', border: 'transparent',
      shadow: hover ? 'var(--shadow-2)' : 'none',
    },
    secondary: {
      bg: hover ? 'var(--color-base-300)' : 'var(--panel)',
      color: 'var(--bone)', border: 'var(--line-strong)', shadow: 'none',
    },
    ghost: {
      bg: hover ? 'var(--panel)' : 'transparent',
      color: 'var(--bone-dim)', border: 'transparent', shadow: 'none',
    },
    danger: {
      bg: hover ? 'var(--danger-soft)' : 'transparent',
      color: 'var(--danger)', border: 'var(--danger)', shadow: 'none',
    },
  };
  const p = palettes[variant] || palettes.primary;

  return (
    <button
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--sp-1) * 2)',
        width: full ? '100%' : 'auto',
        height: s.height, padding: s.padding, fontSize: s.fontSize,
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        letterSpacing: 'var(--ls-normal)',
        color: p.color, background: p.bg,
        border: 'var(--bw) solid ' + p.border, borderRadius: 'var(--r-sm)',
        boxShadow: p.shadow, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: active ? 'scale(0.98)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-mid) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {loading ? <span className="arena-btn-spin" aria-hidden="true" style={{ width: 'calc(var(--sp-1) * 3.5)', height: 'calc(var(--sp-1) * 3.5)', boxSizing: 'border-box', border: 'var(--bw-strong) solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} /> : icon}
      {children}
      {iconRight}
    </button>
  );
}
