import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import type { InputType, ValidateOn } from '../../../Api.generated';

export interface InputProps {

  /** Field label above the control. */
  label?: string;

  /** The control's id, and what the label's `for` points at. Generated from `label` when omitted, as `in-` followed by the label with each run of whitespace replaced by a single hyphen and the whole lowercased. The derivation is normative, and the prefix differs per component on purpose: the same markup must get the same id in every layer, and an Input and a Textarea sharing a label must not collide. */
  id?: string;

  /** A line of help under the field. */
  hint?: string;

  /** Controlled error message; wins over `validate`. */
  error?: string;

  /** Force the valid (green check) state. */
  valid?: boolean;

  /** Marks the label and the control required. */
  required?: boolean;

  /** Called on the value; returns the error message, or empty for valid. */
  validate?: (value: string) => string | null | undefined;

  /** When `validate` runs. */
  validateOn?: ValidateOn;

  /** Native input type. */
  type?: InputType;

  /** Phosphor class name drawn at the field's start. */
  icon?: string;

  /** Static text Arena draws before the value, e.g. `git@`. */
  prefix?: string;

  /** The controlled text. */
  value?: string;

  /** Blocks editing and dims it. */
  disabled?: boolean;

  /** Shows the value but blocks editing. */
  readOnly?: boolean;

  /** Shown when empty. */
  placeholder?: string;

  /** Submitted with the form. */
  name?: string;

  /** The browser autofill hint. */
  autoComplete?: string;

  /** Minimum, for number/date types. */
  min?: string;

  /** Maximum, for number/date types. */
  max?: string;

  /** Step, for number/date types. */
  step?: string;

  /** Caps the length. */
  maxLength?: number;

  /** A regex the value must match. */
  pattern?: string;

  /** Edited; carries the new value. */
  onChange?: (value: string) => void;

  /** Left the field; carries the value. */
  onBlur?: (value: string) => void;
}


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

export interface InputHandle {
  focus(options?: FocusOptions): void;
  select(): void;
}

export const Input = forwardRef<InputHandle, InputProps>(function Input({
  label, id, hint, error, valid = false, required = false,
  validate, validateOn = 'blur', type = 'text',
  icon, prefix, value, disabled = false, readOnly = false,
  placeholder, name, autoComplete, min, max, step, maxLength, pattern,
  onChange, onBlur,
}: InputProps, handle) {
  usePickerIndicator();
  const control = useRef<HTMLInputElement>(null);
  useImperativeHandle(handle, () => ({
    focus: (options?: FocusOptions) => control.current?.focus(options),
    select: () => control.current?.select(),
  }), []);
  const [focus, setFocus] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);

  const shownError = error != null ? error : (touched ? localErr : null);
  const isValid = !shownError && (valid || (touched && validate && localErr === null));

  const runValidate = (v: string) => { if (validate) setLocalErr(validate(v) || null); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange && onChange(e.target.value); if (validateOn === 'change') { setTouched(true); runValidate(e.target.value); } };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { setFocus(false); setTouched(true); runValidate(e.target.value); onBlur && onBlur(e.target.value); };

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
        <input ref={control} id={inputId} type={type} value={value} disabled={disabled} readOnly={readOnly}
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
});
