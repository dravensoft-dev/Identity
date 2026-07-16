import React from 'react';
export function Tag({ children, onRemove, style, ...rest }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      background: 'var(--panel)', color: 'var(--bone-dim)', border: '1px solid var(--color-base-300)',
      borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-body)', fontSize: 13, ...style }} {...rest}>
      {children}
      {onRemove && <button onClick={onRemove} aria-label="Remove" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}><i className="ph-bold ph-x" /></button>}
    </span>
  );
}
