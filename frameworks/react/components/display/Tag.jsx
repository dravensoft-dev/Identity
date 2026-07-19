import React from 'react';
export function Tag({ children, onRemove, style, ...rest }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)',
      background: 'var(--panel)', color: 'var(--bone-dim)', border: 'var(--bw) solid var(--color-base-300)',
      borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)', ...style }} {...rest}>
      {children}
      {onRemove && <button onClick={onRemove} aria-label="Remove" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', padding: 0, fontSize: 'var(--icon-sm)', lineHeight: 'var(--dz-lh)' }}><i className="ph-bold ph-x" /></button>}
    </span>
  );
}
