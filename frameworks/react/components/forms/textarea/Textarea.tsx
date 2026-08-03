import React, { useEffect, useRef } from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './Textarea.manifest.generated.ts';

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

const textareaStyles = tv(manifest);

export function Textarea({
  label, id, hint, error, required = false, rows = 4, maxLength, counter = false,
  disabled = false, readOnly = false, autoResize = false, placeholder, name, value, onChange,
}: TextareaProps) {
  const boxRef = useRef<HTMLTextAreaElement | null>(null);
  const taId = id || (label ? 'ta-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const len = typeof value === 'string' ? value.length : 0;
  const styles = textareaStyles({
    state: error ? 'error' : 'neutral',
    resize: autoResize ? 'none' : 'vertical',
    disabled,
    readonly: readOnly,
  });
  useEffect(() => {
    if (autoResize) fitToContent(boxRef.current);
  }, [autoResize, value, rows]);
  return (
    <div className={styles.root()}>
      {label && (
        <label htmlFor={taId} className={styles.label()}>
          {label}{required && <span className={styles.required()}>*</span>}
        </label>
      )}
      <textarea ref={boxRef} id={taId} rows={rows} maxLength={maxLength} disabled={disabled} required={required}
        readOnly={readOnly} placeholder={placeholder} name={name}
        aria-invalid={!!error} value={value}
        onChange={(e) => { if (autoResize) fitToContent(e.target); onChange && onChange(e.target.value); }}
        className={styles.field()} />
      <div className={styles.foot()}>
        {error ? <span className={styles.error()}>{error}</span>
          : hint ? <span className={styles.hint()}>{hint}</span> : <span />}
        {counter && maxLength && (
          <span className={len > maxLength * 0.9 ? styles.counterNear() : styles.counter()}>{len}/{maxLength}</span>
        )}
      </div>
    </div>
  );
}
