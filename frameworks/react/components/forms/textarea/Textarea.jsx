import React, { useState } from 'react';

export function borderBoxSlack(element) {
  return element.offsetHeight - element.clientHeight;
}

export function Textarea({
  label, id, hint, error, required = false, rows = 4, maxLength, counter = false,
  disabled = false, readOnly = false, autoResize = false, placeholder, name, value, onChange,
}) {
  const [focus, setFocus] = useState(false);
  const taId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--gold)' : 'var(--color-base-300)';
  const ring = error ? '0 0 0 var(--focus-width) var(--danger-soft)' : focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none';
  const len = typeof value === 'string' ? value.length : 0;
  const grow = (e) => {
    if (!autoResize) return;
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + borderBoxSlack(el)}px`;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1.5)' }}>
      {label && (
        <label htmlFor={taId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 'calc(var(--sp-1) * 1)' }}>*</span>}
        </label>
      )}
      <textarea id={taId} rows={rows} maxLength={maxLength} disabled={disabled} required={required}
        readOnly={readOnly} placeholder={placeholder} name={name}
        aria-invalid={!!error} value={value}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { grow(e); onChange && onChange(e.target.value); }}
        style={{ width: '100%', padding: 'calc(var(--sp-1) * 2.5) calc(var(--sp-1) * 3)',
          background: readOnly ? 'var(--panel)' : 'var(--surface-input)', cursor: readOnly ? 'default' : 'text',
          border: 'var(--bw) solid ' + borderColor, borderRadius: 'var(--r-sm)', boxShadow: ring,
          color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', lineHeight: 'var(--lh-body)',
          resize: autoResize ? 'none' : 'vertical', outline: 'none', opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
        {error ? <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>{error}</span>
          : hint ? <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', fontFamily: 'var(--font-body)' }}>{hint}</span> : <span />}
        {counter && maxLength && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', color: len > maxLength * 0.9 ? 'var(--warning)' : 'var(--mute)' }}>{len}/{maxLength}</span>}
      </div>
    </div>
  );
}
