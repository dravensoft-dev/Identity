import React from 'react';
export function Checkbox({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{ width: 20, height: 20, borderRadius: 'var(--r-xs)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--crimson)' : 'var(--surface-input)',
        border: '1px solid ' + (checked ? 'var(--crimson)' : 'var(--line-strong)'),
        transition: 'background var(--dur-fast) var(--ease-out)' }}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--bone-dim)' }}>{label}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
    </label>
  );
}
