import React, { useState } from 'react';
/** Multi-line text field. Same states as Input (neutral, gold focus, crimson error).
 * `autoResize` grows with the content; `counter` with `maxLength` shows the count. */
export function Textarea({
  label, hint, error, required = false, rows = 4, maxLength, counter = false,
  disabled = false, autoResize = false, style, id, value, onChange, ...rest
}) {
  const [focus, setFocus] = useState(false);
  const taId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--gold)' : 'var(--color-base-300)';
  const ring = error ? '0 0 0 2px var(--danger-soft)' : focus ? '0 0 0 2px var(--gold-soft)' : 'none';
  const len = typeof value === 'string' ? value.length : 0;
  const grow = (e) => { if (autoResize) { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; } };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label htmlFor={taId} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <textarea id={taId} rows={rows} maxLength={maxLength} disabled={disabled} required={required}
        aria-invalid={!!error} value={value}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { grow(e); onChange && onChange(e); }}
        style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-input)',
          border: '1px solid ' + borderColor, borderRadius: 'var(--r-sm)', boxShadow: ring,
          color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.55,
          resize: autoResize ? 'none' : 'vertical', outline: 'none', opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)' }} {...rest} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        {error ? <span style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>{error}</span>
          : hint ? <span style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-body)' }}>{hint}</span> : <span />}
        {counter && maxLength && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: len > maxLength * 0.9 ? 'var(--warning)' : 'var(--mute)' }}>{len}/{maxLength}</span>}
      </div>
    </div>
  );
}
