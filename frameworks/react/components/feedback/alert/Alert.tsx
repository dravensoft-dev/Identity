import React from 'react';

import type { AlertTone } from '../../../Api.generated';

export interface AlertProps {
  /** The severity — colour, default icon, and (for danger) the alert role. */
  tone?: AlertTone;
  /** An optional bold lead line above the message. */
  title?: string;
  /** The message body. */
  children?: React.ReactNode;
  /** A Phosphor class name overriding the tone's default glyph. Arena draws it. */
  icon?: string;
  /** The label of a single inline action button. Absent renders no action. */
  actionLabel?: string;
  /** The inline action button was activated. */
  onAction?: () => void;
  /** Whether the × is shown. Every layer gates the × on this member and never on whether anything listens for `close` — R6. */
  dismissible?: boolean;
  /** The × was activated. */
  onClose?: () => void;
}

const TONES = {
  info:    { color: 'var(--info)',    soft: 'var(--info-soft)',    icon: 'ph-fill ph-info' },
  success: { color: 'var(--success)', soft: 'var(--success-soft)', icon: 'ph-fill ph-check-circle' },
  warning: { color: 'var(--warning)', soft: 'var(--warning-soft)', icon: 'ph-fill ph-warning' },
  danger:  { color: 'var(--danger)',  soft: 'var(--danger-soft)',  icon: 'ph-fill ph-warning-octagon' },
  neutral: { color: 'var(--line-strong)', soft: 'var(--panel)',    icon: 'ph-fill ph-note' },
};

export function Alert({ tone = 'info', title, children, icon, actionLabel, onAction, dismissible, onClose }: AlertProps) {
  const t = TONES[tone] || TONES.info;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'}
      style={{ display: 'flex', gap: 'calc(var(--sp-1) * 3)', alignItems: 'flex-start', padding: 'calc(var(--sp-1) * 3.5) calc(var(--sp-1) * 4)',
        background: t.soft, border: 'var(--bw) solid ' + t.color, borderRadius: 'var(--r-md)' }}>
      <i className={icon || t.icon} style={{ color: t.color, fontSize: 'var(--icon-lg)', lineHeight: 'var(--dz-lh)', flexShrink: 0, marginTop: 0 }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text)', color: 'var(--bone)' }}>{title}</div>}
        {children && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: 'var(--bone-dim)', lineHeight: 'var(--lh-body)', marginTop: title ? 'var(--sp-1)' : 0 }}>{children}</div>}
        {actionLabel && (
          <button onClick={onAction}
            style={{ marginTop: 'calc(var(--sp-1) * 2.5)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-uppercase-status)', textTransform: 'uppercase', color: t.color }}>
            {actionLabel}
          </button>
        )}
      </div>
      {dismissible && (
        <button onClick={onClose} aria-label="Dismiss"
          style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 'var(--icon-md)', lineHeight: 'var(--dz-lh)' }}>
          <i className="ph-bold ph-x" />
        </button>
      )}
    </div>
  );
}
