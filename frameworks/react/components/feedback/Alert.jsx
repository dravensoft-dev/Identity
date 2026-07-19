import React from 'react';
const TONES = {
  info:    { color: 'var(--info)',    soft: 'var(--info-soft)',    icon: 'ph-fill ph-info' },
  success: { color: 'var(--success)', soft: 'var(--success-soft)', icon: 'ph-fill ph-check-circle' },
  warning: { color: 'var(--warning)', soft: 'var(--warning-soft)', icon: 'ph-fill ph-warning' },
  danger:  { color: 'var(--danger)',  soft: 'var(--danger-soft)',  icon: 'ph-fill ph-warning-octagon' },
  neutral: { color: 'var(--line-strong)', soft: 'var(--panel)',    icon: 'ph-fill ph-note' },
};
/** Persistent message embedded in the page (not ephemeral). Unlike Toast, it stays
 * until the condition is resolved. Use `tone` for severity; `action` adds an action
 * link; `onClose` makes it dismissible (single Phosphor ph-x close icon). */
export function Alert({ tone = 'info', title, children, icon, action, onClose, style }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'}
      style={{ display: 'flex', gap: 'calc(var(--sp-1) * 3)', alignItems: 'flex-start', padding: 'calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4)',
        background: t.soft, border: 'var(--bw) solid ' + t.color, borderRadius: 'var(--r-md)', ...style }}>
      <i className={icon || t.icon} style={{ color: t.color, fontSize: 'var(--icon-lg)', lineHeight: 'var(--dz-lh)', flexShrink: 0, marginTop: 0 }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', color: 'var(--bone)' }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--bone-dim)', lineHeight: 'var(--lh-body)', marginTop: title ? 'var(--sp-1)' : 0 }}>{children}</div>}
        {action && (
          <button onClick={action.onClick}
            style={{ marginTop: 'calc(var(--sp-1) * 2.5)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-uppercase-status)', textTransform: 'uppercase', color: t.color }}>
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss"
          style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 'var(--icon-md)', lineHeight: 'var(--dz-lh)' }}>
          <i className="ph-bold ph-x" />
        </button>
      )}
    </div>
  );
}
