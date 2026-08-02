import React, { useEffect, useRef, useState } from 'react';

export interface TextareaProps {

  /** Field label; the counter and error sit under the field. */
  label?: string;

  /** The control's id, and what the label's `for` points at. Generated from `label` when omitted, as `ta-` followed by the label with each run of whitespace replaced by a single hyphen and the whole lowercased: the derivation Input.id states, under this component's own prefix. */
  id?: string;

  /** A line of help under the field. */
  hint?: string;

  /** Error message; turns the border crimson and shows below. */
  error?: string;

  /** Marks the label and the control required. */
  required?: boolean;

  /** Shows a live length/maxLength count, which warns once the length is STRICTLY past nine tenths of `maxLength`; exactly at the share is not yet near the limit. */
  counter?: boolean;

  /** Grows with the content instead of scrolling. */
  autoResize?: boolean;

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

  /** Caps the length; feeds the counter. */
  maxLength?: number;

  /** Initial visible rows. */
  rows?: number;

  /** Edited; carries the new text. */
  onChange?: (value: string) => void;
}


export function borderBoxSlack(element: HTMLElement): number {
  return element.offsetHeight - element.clientHeight;
}

export function fitToContent(element: HTMLElement | null): void {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight + borderBoxSlack(element)}px`;
}

export function Textarea({
  label, id, hint, error, required = false, rows = 4, maxLength, counter = false,
  disabled = false, readOnly = false, autoResize = false, placeholder, name, value, onChange,
}: TextareaProps) {
  const [focus, setFocus] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement | null>(null);
  const taId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const borderColor = error ? 'var(--danger)' : focus ? 'var(--gold)' : 'var(--color-base-300)';
  const ring = error ? '0 0 0 var(--focus-width) var(--danger-soft)' : focus ? '0 0 0 var(--focus-width) var(--gold-soft)' : 'none';
  const len = typeof value === 'string' ? value.length : 0;
  useEffect(() => {
    if (autoResize) fitToContent(boxRef.current);
  }, [autoResize, value, rows]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 1.5)' }}>
      {label && (
        <label htmlFor={taId} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-field-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>
          {label}{required && <span style={{ color: 'var(--crimson)', marginLeft: 'calc(var(--sp-1) * 1)' }}>*</span>}
        </label>
      )}
      <textarea ref={boxRef} id={taId} rows={rows} maxLength={maxLength} disabled={disabled} required={required}
        readOnly={readOnly} placeholder={placeholder} name={name}
        aria-invalid={!!error} value={value}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => { if (autoResize) fitToContent(e.target); onChange && onChange(e.target.value); }}
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
