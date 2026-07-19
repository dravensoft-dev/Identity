import React from 'react';
/** On/off switch. On = crimson.
 * `confirm` (H5): for high-impact toggles (e.g. auto-deploy). Instead of changing on the fly,
 * the change attempt is redirected to `onRequestChange(next)` so the host can open a ConfirmDialog;
 * `onChange` only fires after confirmation. Without `confirm`, it behaves like a normal switch. */
export function Switch({ checked = false, onChange, onRequestChange, confirm = false, label, disabled = false, style, ...rest }) {
  const guarded = confirm && typeof onRequestChange === 'function';
  const attempt = (e) => {
    if (disabled) return;
    if (guarded) { e.preventDefault(); onRequestChange(!checked); }
  };
  return (
    <label onClick={attempt} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span style={{ width: 40, height: 22, borderRadius: 'var(--r-pill)', padding: 2, display: 'inline-flex', alignItems: 'center',
        background: checked ? 'var(--crimson)' : 'var(--line-strong)', transition: 'background var(--dur-mid) var(--ease-out)' }}>
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--on-accent)',
          transform: checked ? 'translateX(18px)' : 'translateX(0)', transition: 'transform var(--dur-mid) var(--ease-out)' }} />
      </span>
      {label && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)', color: 'var(--bone-dim)' }}>{label}{confirm && <i className="ph-bold ph-shield-check" title="Requires confirmation" style={{ fontSize: 'var(--icon-sm)', color: 'var(--mute)' }} />}</span>}
      <input type="checkbox" role="switch" checked={checked} aria-checked={checked} onChange={guarded ? undefined : onChange} disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} {...rest} />
    </label>
  );
}
