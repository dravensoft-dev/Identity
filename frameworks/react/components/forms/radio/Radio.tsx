import React, { useEffect } from 'react';

export interface RadioInjected {
  name: string;
  checked: boolean;
  onSelect: (value: string) => void;
}

export interface RadioProps {

  /** This option's value, matched against the group's. */
  value: string;

  /** The option's label. */
  label?: string;

  /** A line of help under the label. */
  hint?: string;

  /** Blocks selection and dims the option. */
  disabled?: boolean;
}


let injected = false;
function useFocusRing() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-radio', '');
    s.textContent =
      '.arena-radio-ring:has(~ input:focus-visible)'
      + '{box-shadow:0 0 0 var(--focus-width) var(--gold-soft)}';
    document.head.appendChild(s);
  }, []);
}

export function Radio({ value, label, hint, name, checked = false, onSelect, disabled = false }: RadioProps & Partial<RadioInjected>) {
  if (!value) throw new Error('Radio: `value` is required');
  useFocusRing();
  return (
    <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 'calc(var(--sp-1) * 2.5)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span className="arena-radio-ring" style={{ width: 'calc(var(--sp-1) * 5)', height: 'calc(var(--sp-1) * 5)', borderRadius: '50%', flexShrink: 0, marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-input)', border: 'var(--bw) solid ' + (checked ? 'var(--crimson)' : 'var(--line-strong)'),
        transition: 'border-color var(--dur-fast) var(--ease-out)' }}>
        {checked && <span style={{ width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)', borderRadius: '50%', background: 'var(--crimson)' }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 0.5)' }}>
        {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', color: 'var(--bone-dim)', lineHeight: 'var(--lh-snug)' }}>{label}</span>}
        {hint && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', lineHeight: 'var(--lh-body)' }}>{hint}</span>}
      </span>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={() => onSelect && onSelect(value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
    </label>
  );
}
