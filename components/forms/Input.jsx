import React, { useState } from 'react';
/**
 * Text field with validation (H5). Visual states: neutral, focus (gold ring),
 * `error` (crimson border + message) and `valid` (green border/check). Pass `required`
 * to mark the field; `validate(value)` returns an error string or null and is evaluated
 * according to `validateOn` ('blur' by default | 'change' for live validation).
 */
export function Input({
  label, hint, error, valid = false, required = false,
  validate, validateOn = 'blur',
  icon, prefix, disabled = false, style, id, onChange, onBlur, ...rest
}) {
  const [focus, setFocus] = useState(false);
  const [localErr, setLocalErr] = useState(null);
  const [touched, setTouched] = useState(false);
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);

  const shownError = error != null ? error : (touched ? localErr : null);
  const isValid = !shownError && (valid || (touched && validate && localErr === null));

  const runValidate = (v) => { if (validate) setLocalErr(validate(v) || null); };
  const handleChange = (e) => { onChange && onChange(e); if (validateOn === 'change') { setTouched(true); runValidate(e.target.value); } };
  const handleBlur = (e) => { setFocus(false); setTouched(true); runValidate(e.target.value); onBlur && onBlur(e); };

  const borderColor = shownError ? 'var(--danger)' : focus ? 'var(--gold)' : isValid ? 'var(--success)' : 'var(--color-base-300)';
  const ring = shownError ? '0 0 0 2px var(--danger-soft)' : focus ? '0 0 0 2px var(--gold-soft)' : isValid ? '0 0 0 2px var(--success-soft)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px',
        background: 'var(--surface-input)', border: '1px solid ' + borderColor,
        borderRadius: 'var(--r-sm)', boxShadow: ring, opacity: disabled ? 0.5 : 1,
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)' }}>
        {icon && <span style={{ color: 'var(--mute)', display: 'inline-flex' }}>{icon}</span>}
        {prefix && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--mute)' }}>{prefix}</span>}
        <input id={inputId} disabled={disabled} required={required} aria-invalid={!!shownError}
          onFocus={() => setFocus(true)} onBlur={handleBlur} onChange={handleChange}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--bone)',
            fontFamily: 'var(--font-body)', fontSize: 14 }} {...rest} />
        {shownError && <i className="ph-fill ph-warning-circle" style={{ color: 'var(--danger)', fontSize: 16 }} />}
        {isValid && <i className="ph-fill ph-check-circle" style={{ color: 'var(--success)', fontSize: 16 }} />}
      </div>
      {shownError ? <span style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>{shownError}</span>
        : hint && <span style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-body)' }}>{hint}</span>}
    </div>
  );
}
