import React, { useEffect, useState } from 'react';

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
  label, id, hint, error, valid = false, required = false,
  validate, validateOn = 'blur', type = 'text',
  icon, prefix, value, disabled = false, readOnly = false,
  placeholder, name, autoComplete, min, max, step, maxLength, pattern,
  onChange, onBlur,
}) {
  usePickerIndicator();
  const [focus, setFocus] = useState(false);
  const [localErr, setLocalErr] = useState(null);
  const [touched, setTouched] = useState(false);
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);

  const shownError = error != null ? error : (touched ? localErr : null);
  const isValid = !shownError && (valid || (touched && validate && localErr === null));

  const runValidate = (v) => { if (validate) setLocalErr(validate(v) || null); };
  const handleChange = (e) => { onChange && onChange(e.target.value); if (validateOn === 'change') { setTouched(true); runValidate(e.target.value); } };
  const handleBlur = (e) => { setFocus(false); setTouched(true); runValidate(e.target.value); onBlur && onBlur(e.target.value); };

  const borderColor = shownError ? 'var(--danger)' : focus ? 'var(--gold)' : isValid ? 'var(--success)' : 'var(--color-base-300)';
  const ring = shownError ? '0 0 0 var(--focus-width) var(--danger-soft)' : focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : isValid ? '0 0 0 var(--focus-width) var(--success-soft)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1.5)' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 'calc(var(--sp-1) * 1)' }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', height: 'var(--dz-ctl-h)', padding: '0 calc(var(--sp-1) * 3)',
        background: readOnly ? 'var(--panel)' : 'var(--surface-input)', border: 'var(--bw) solid ' + borderColor,
        borderRadius: 'var(--r-sm)', boxShadow: ring, opacity: disabled ? 0.5 : 1,
        transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)' }}>
        {icon && <i className={icon} aria-hidden="true" style={{ color: 'var(--mute)' }} />}
        {prefix && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-md)', color: 'var(--mute)' }}>{prefix}</span>}
        <input id={inputId} type={type} value={value} disabled={disabled} readOnly={readOnly}
          required={required} aria-invalid={!!shownError} className="arena-input"
          placeholder={placeholder} name={name} autoComplete={autoComplete}
          min={min} max={max} step={step} maxLength={maxLength} pattern={pattern}
          onFocus={() => setFocus(true)} onBlur={handleBlur} onChange={handleChange}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            cursor: readOnly ? 'default' : 'text',
            color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)' }} />
        {shownError && <i className="ph-fill ph-warning-circle" aria-hidden="true" style={{ color: 'var(--danger)', fontSize: 'var(--icon-md)' }} />}
        {isValid && <i className="ph-fill ph-check-circle" aria-hidden="true" style={{ color: 'var(--success)', fontSize: 'var(--icon-md)' }} />}
      </div>
      {shownError ? <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>{shownError}</span>
        : hint && <span style={{ fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', fontFamily: 'var(--font-body)' }}>{hint}</span>}
    </div>
  );
}
