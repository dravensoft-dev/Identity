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
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px',
        background: t.soft, border: '1px solid ' + t.color, borderRadius: 'var(--r-md)', ...style }}>
      <i className={icon || t.icon} style={{ color: t.color, fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--bone)' }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.55, marginTop: title ? 3 : 0 }}>{children}</div>}
        {action && (
          <button onClick={action.onClick}
            style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.color }}>
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss"
          style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
          <i className="ph-bold ph-x" />
        </button>
      )}
    </div>
  );
}
