import React from 'react';
/** Single selection. `RadioGroup` governs the value; each `Radio` is an option.
 * Selected = crimson dot inside the ring. Use Radio when the options are
 * mutually exclusive and it's good to see them all; for many options, use Select. */
export function RadioGroup({ value, onChange, name, children, style, ...rest }) {
  const gname = name || 'rg-' + Math.random().toString(36).slice(2, 7);
  const items = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { name: gname, checked: child.props.value === value, onSelect: onChange })
      : child);
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)', ...style }} {...rest}>
      {items}
    </div>
  );
}
export function Radio({ value, label, hint, name, checked = false, onSelect, disabled = false, style, ...rest }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 'calc(var(--sp-1) * 2.5)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{ width: 'calc(var(--sp-1) * 5)', height: 'calc(var(--sp-1) * 5)', borderRadius: '50%', flexShrink: 0, marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-input)', border: 'var(--bw) solid ' + (checked ? 'var(--crimson)' : 'var(--line-strong)'),
        transition: 'border-color var(--dur-fast) var(--ease-out)' }}>
        {checked && <span style={{ width: 'calc(var(--sp-1) * 2.5)', height: 'calc(var(--sp-1) * 2.5)', borderRadius: '50%', background: 'var(--crimson)' }} />}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 0.5)' }}>
        {label && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', color: 'var(--bone-dim)', lineHeight: 'var(--lh-snug)' }}>{label}</span>}
        {hint && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', lineHeight: 'var(--lh-body)' }}>{hint}</span>}
      </span>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={() => onSelect && onSelect(value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
    </label>
  );
}
