import React from 'react';
/** Per-tone border/text colour, mirroring Tag.manifest.json's `tone` variant
 *  (`border-X text-X`, `neutral` staying the pre-existing bone-dim/base-300 pair). */
const TONES = {
  neutral: 'var(--bone-dim)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
};
const BORDERS = {
  neutral: 'var(--color-base-300)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
};
export function Tag({ children, tone = 'neutral', removable = false, onRemove }) {
  const color = TONES[tone] || TONES.neutral;
  const border = BORDERS[tone] || BORDERS.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)',
      background: 'var(--panel)', color, border: 'var(--bw) solid ' + border,
      borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-md)' }}>
      <span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: 'calc(var(--sp-1) * 1.5)', height: 'calc(var(--sp-1) * 1.5)', borderRadius: '50%', background: 'currentColor' }} />
      {children}
      {removable && <button onClick={onRemove} aria-label="Remove" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', padding: 0, fontSize: 'var(--icon-sm)', lineHeight: 'var(--dz-lh)' }}><i className="ph-bold ph-x" /></button>}
    </span>
  );
}
