import React from 'react';
const TOAST_TONES = { neutral: 'var(--line-strong)', success: 'var(--success)', danger: 'var(--danger)', gold: 'var(--gold)' };
/** Ephemeral notification. `action` adds a button (Undo / Retry / View logs).
 * `persist` (H1): disables the host's auto-dismiss — mandatory in critical/error states
 * so they don't disappear before being read; they only close via the × or an action. */
export function Toast({ title, message, tone = 'neutral', action, onClose, persist = false, style }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} aria-live={tone === 'danger' ? 'assertive' : 'polite'} data-persist={persist ? '' : undefined}
      style={{ display: 'flex', gap: 'calc(var(--sp-1) * 3)', alignItems: 'flex-start', width: 'calc(var(--sp-1) * 85)', padding: 'calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4)', zIndex: 'var(--z-toast)',
      background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
      borderLeft: 'var(--bw-strong) solid ' + (TOAST_TONES[tone] || TOAST_TONES.neutral), borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', ...style }}>
      <div style={{ flex: 1 }}>
        {title && <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', color: 'var(--bone)' }}>{title}{persist && <span title="Does not auto-dismiss" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-column-header)', color: 'var(--mute)', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-xs)', padding: '0 calc(var(--sp-1) * 1)', textTransform: 'uppercase' }}>Pinned</span>}</div>}
        {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: 'var(--mute)', marginTop: 'calc(var(--sp-1) * 0.5)' }}>{message}</div>}
        {action && (
          <button onClick={action.onClick}
            style={{ marginTop: 'calc(var(--sp-1) * 2.5)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-uppercase-status)', textTransform: 'uppercase',
              color: tone === 'danger' ? 'var(--gold)' : 'var(--crimson)' }}>
            {action.label}
          </button>
        )}
      </div>
      {onClose && <button onClick={onClose} aria-label="Close" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 'var(--icon-md)', lineHeight: 'var(--dz-lh)' }}><i className="ph-bold ph-x" /></button>}
    </div>
  );
}
