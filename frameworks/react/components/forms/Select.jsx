import React, { useState } from 'react';
export function Select({ label, options = [], value, onChange, disabled = false, style, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1.5)', ...style }}>
      {label && <label style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={onChange} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: 'none', width: '100%', height: 'var(--dz-ctl-h)', padding: '0 calc(var(--sp-1) * 9) 0 calc(var(--sp-1) * 3)',
            background: 'var(--surface-input)', color: 'var(--bone)',
            border: 'var(--bw) solid ' + (focus ? 'var(--gold)' : 'var(--color-base-300)'), borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', cursor: 'pointer',
            boxShadow: focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none', opacity: disabled ? 0.5 : 1,
            transition: 'border-color var(--dur-fast) var(--ease-out)' }} {...rest}>
          {options.map((o) => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 'calc(var(--sp-1) * 3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--mute)', fontSize: 'var(--icon-sm)' }}>▾</span>
      </div>
    </div>
  );
}
