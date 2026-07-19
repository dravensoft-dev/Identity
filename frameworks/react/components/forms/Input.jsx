import React, { useEffect, useState } from 'react';
/**
 * Text field with validation (H5). Visual states: neutral, focus (gold ring),
 * `error` (crimson border + message) and `valid` (green border/check). Pass `required`
 * to mark the field; `validate(value)` returns an error string or null and is evaluated
 * according to `validateOn` ('blur' by default | 'change' for live validation).
 */

/* The native date/time picker indicator is a vendor pseudo-element: an inline
 * style cannot reach it, and it ships near-black — invisible on Arena's dark
 * input surface. This is the one sanctioned exception to "components carry no
 * CSS": it targets a vendor pseudo-element, never a class of ours. Same
 * injected <style> pattern as ProgressBar. --picker-invert is theme polarity
 * (1 dark / 0 light), defined in tokens/colors.css. */
let injected = false;
function usePickerIndicator() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-input', '');
    s.textContent =
      '.arena-input::-webkit-calendar-picker-indicator{cursor:pointer;opacity:.6;' +
      'filter:invert(var(--picker-invert,1));transition:opacity var(--dur-fast) var(--ease-out)}' +
      '.arena-input::-webkit-calendar-picker-indicator:hover{opacity:1}';
    document.head.appendChild(s);
  }, []);
}

export function Input({
  label, hint, error, valid = false, required = false,
  validate, validateOn = 'blur',
  icon, prefix, disabled = false, style, id, className, onChange, onBlur, ...rest
}) {
  usePickerIndicator();
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
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 'var(--dz-ctl-h)', boxSizing: 'border-box', padding: '0 12px',
        background: 'var(--surface-input)', border: 'var(--bw) solid ' + borderColor,
        borderRadius: 'var(--r-sm)', boxShadow: ring, opacity: disabled ? 0.5 : 1,
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)' }}>
        {icon && <span style={{ color: 'var(--mute)', display: 'inline-flex' }}>{icon}</span>}
        {prefix && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{prefix}</span>}
        <input id={inputId} disabled={disabled} required={required} aria-invalid={!!shownError}
          className={['arena-input', className].filter(Boolean).join(' ')}
          onFocus={() => setFocus(true)} onBlur={handleBlur} onChange={handleChange}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)' }} {...rest} />
        {shownError && <i className="ph-fill ph-warning-circle" style={{ color: 'var(--danger)', fontSize: 'var(--icon-md)' }} />}
        {isValid && <i className="ph-fill ph-check-circle" style={{ color: 'var(--success)', fontSize: 'var(--icon-md)' }} />}
      </div>
      {shownError ? <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>{shownError}</span>
        : hint && <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', fontFamily: 'var(--font-body)' }}>{hint}</span>}
    </div>
  );
}
