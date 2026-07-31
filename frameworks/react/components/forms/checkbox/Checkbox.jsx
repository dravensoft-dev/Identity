import React, { useEffect } from 'react';

let injected = false;
function useFocusRing() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const s = document.createElement('style');
    s.setAttribute('data-arena-checkbox', '');
    s.textContent =
      '.arena-check-box:has(~ input:focus-visible)'
      + '{box-shadow:0 0 0 var(--focus-width) var(--gold-soft)}';
    document.head.appendChild(s);
  }, []);
}
export function Checkbox({ checked = false, onChange, label, disabled = false, required = false, name, value }) {
  useFocusRing();
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2.5)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span className="arena-check-box" style={{ width: 'calc(var(--sp-1) * 5)', height: 'calc(var(--sp-1) * 5)', borderRadius: 'var(--r-xs)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--crimson)' : 'var(--surface-input)',
        border: 'var(--bw) solid ' + (checked ? 'var(--crimson)' : 'var(--line-strong)'),
        transition: 'background var(--dur-fast) var(--ease-out)' }}>
        {checked && <svg style={{ width: 'var(--sp-3)', height: 'var(--sp-3)' }} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="var(--on-accent)" style={{ strokeWidth: 'var(--bw-strong)' }} strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}>{label}</span>}
      <input type="checkbox" checked={checked} name={name} value={value} required={required} onChange={(e) => onChange && onChange(e.target.checked)} disabled={disabled} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
    </label>
  );
}
