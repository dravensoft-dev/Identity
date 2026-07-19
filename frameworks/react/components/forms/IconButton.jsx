import React, { useState } from 'react';
/* Same density tokens as Button — the two sit side by side in toolbars and must
 * re-densify together. */
const SZ = { sm: 'var(--dz-ctl-h-sm)', md: 'var(--dz-ctl-h)', lg: 'var(--dz-ctl-h-lg)' };
/** Icon-only button. `label` is required (accessible name in ALL states, not just hover).
 * `showLabel` (H6): shows the text next to the icon where there's room — don't rely only on the tooltip
 * on touch or keyboard surfaces. */
export function IconButton({ children, size = 'md', variant = 'ghost', label, showLabel = false, disabled = false, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const d = SZ[size] || SZ.md;
  const bg = variant === 'solid'
    ? (hover ? 'var(--crimson-strong)' : 'var(--crimson)')
    : (hover ? 'var(--panel)' : 'transparent');
  const color = variant === 'solid' ? 'var(--on-accent)' : 'var(--bone-dim)';
  return (
    <button aria-label={label} title={showLabel ? undefined : label} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ height: d, width: showLabel ? 'auto' : d, minWidth: d, padding: showLabel ? '0 14px 0 12px' : 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: showLabel ? 8 : 0,
        background: bg, color, border: variant === 'solid' ? 'none' : '1px solid var(--color-base-300)',
        borderRadius: 'var(--r-sm)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)', ...style }} {...rest}>
      {children}
      {showLabel && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', lineHeight: 'var(--dz-lh)' }}>{label}</span>}
    </button>
  );
}
