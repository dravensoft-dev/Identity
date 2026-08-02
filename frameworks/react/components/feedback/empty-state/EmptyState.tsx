import React from 'react';

export interface EmptyStateProps {

  /** A Phosphor class name for the glyph Arena draws, muted. */
  icon?: string;

  /** The headline: what is empty. */
  title: string;
  /** A sentence of guidance under the title. */
  message?: string;
  /** A single call-to-action control, centred under the message. */
  action?: React.ReactNode;
}


export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  if (!title) throw new Error('EmptyState: `title` is required');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'calc(var(--sp-1) * 3)',
      padding: 'calc(var(--sp-1) * 14) calc(var(--sp-1) * 8)', border: 'var(--bw) dashed var(--line-strong)', borderRadius: 'var(--r-lg)', background: 'var(--surface-card)' }}>
      {icon && <div style={{ fontSize: 'var(--icon-xl)', color: 'var(--mute)', lineHeight: 'var(--dz-lh)' }}><i className={icon} aria-hidden="true" /></div>}
      {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h4)', color: 'var(--bone)' }}>{title}</div>}
      {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', color: 'var(--mute)', maxWidth: '42ch', lineHeight: 'var(--lh-body)' }}>{message}</div>}
      {action && <div style={{ marginTop: 'calc(var(--sp-1) * 1.5)' }}>{action}</div>}
    </div>
  );
}
