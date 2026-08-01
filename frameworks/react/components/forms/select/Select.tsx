import React, { useId, useState } from 'react';

import type { SelectOption } from '../../../Api.generated';

export type { SelectOption };
export interface SelectProps {

  /** Field label above the control. */
  label?: string;

  /** An empty-valued first option, drawn before the choices and unselectable once a real one is made -- "Choose a customer". It is an option rather than an attribute because a native select has no placeholder, and it is what makes "nothing chosen yet" distinguishable from "the first choice". */
  placeholder?: string;

  /** The choices, drawn as native options. */
  options?: SelectOption[];

  /** The selected option's value. */
  value?: string;

  /** Blocks the control and dims it. */
  disabled?: boolean;

  /** Must have a value for the form to submit. */
  required?: boolean;

  /** A line of help under the field. */
  hint?: string;

  /** Controlled error message. It is the whole validation surface here, unlike Input, which also takes a `validate` function: a native select offers a closed list, so there is no value to parse and nothing for a validator to reject that the options did not already prevent. */
  error?: string;

  /** Force the valid (green check) state. */
  valid?: boolean;

  /** Phosphor class name drawn at the field's start. */
  icon?: string;

  /** Submitted with the form. */
  name?: string;


  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}

export function Select({
  label, placeholder, options = [], value, onChange, disabled = false, required = false,
  hint, error, valid = false, icon, name,
}: SelectProps) {
  const [focus, setFocus] = useState(false);
  const selectId = `select-${useId().replace(/:/g, '')}`;
  const noteId = `${selectId}-note`;

  const hasError = Boolean(error);
  const border = hasError ? 'var(--error)' : valid ? 'var(--success)' : focus ? 'var(--gold)' : 'var(--color-base-300)';
  const ring = hasError
    ? '0 0 0 var(--focus-width) var(--danger-soft)'
    : valid
      ? '0 0 0 var(--focus-width) var(--success-soft)'
      : focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1.5)' }}>
      {label && <label htmlFor={selectId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <i className={icon} aria-hidden="true" style={{ position: 'absolute', left: 'calc(var(--sp-1) * 3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', color: 'var(--mute)', fontSize: 'var(--icon-md)' }} />}
        <select id={selectId} value={value} onChange={(e) => onChange && onChange(e.target.value)} disabled={disabled}
          required={required} name={name}
          aria-invalid={hasError || undefined} aria-describedby={error || hint ? noteId : undefined}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: 'none', width: '100%', height: 'var(--dz-ctl-h)',
            padding: '0 calc(var(--sp-1) * 9) 0 ' + (icon ? 'calc(var(--sp-1) * 9)' : 'calc(var(--sp-1) * 3)'),
            background: 'var(--surface-input)', color: 'var(--bone)',
            border: 'var(--bw) solid ' + border, borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', cursor: 'pointer',
            boxShadow: ring, opacity: disabled ? 0.5 : 1,
            transition: 'border-color var(--dur-fast) var(--ease-out)' }}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 'calc(var(--sp-1) * 3)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--mute)', fontSize: 'var(--icon-sm)' }} aria-hidden="true">▾</span>
      </div>
      {error
        ? <span id={noteId} style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--error)' }}>{error}</span>
        : hint && <span id={noteId} style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{hint}</span>}
    </div>
  );
}
