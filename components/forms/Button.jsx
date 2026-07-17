import React, { useState } from 'react';

/* Heights come from the density tokens, so inside `.arena-compact` the button
 * re-densifies with the rows around it instead of towering over them. */
const SIZES = {
  sm: { padding: '0 12px', height: 'var(--dz-ctl-h-sm)', fontSize: 13 },
  md: { padding: '0 18px', height: 'var(--dz-ctl-h)', fontSize: 14 },
  lg: { padding: '0 26px', height: 'var(--dz-ctl-h-lg)', fontSize: 15 },
};

export function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  disabled = false, loading = false, full = false, style, ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const s = SIZES[size] || SIZES.md;

  const palettes = {
    primary: {
      bg: hover ? 'var(--crimson-strong)' : 'var(--crimson)',
      color: 'var(--on-accent)', border: 'transparent',
      shadow: hover ? 'var(--glow-accent)' : 'none',
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
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: full ? '100%' : 'auto',
        height: s.height, padding: s.padding, fontSize: s.fontSize,
        fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)',
        letterSpacing: '.01em',
        color: p.color, background: p.bg,
        border: '1px solid ' + p.border, borderRadius: 'var(--r-sm)',
        boxShadow: p.shadow, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: active ? 'scale(0.98)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-mid) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'arena-spin .7s linear infinite' }} /> : icon}
      {children}
      {iconRight}
      <style>{'@keyframes arena-spin{to{transform:rotate(360deg)}}'}</style>
    </button>
  );
}
