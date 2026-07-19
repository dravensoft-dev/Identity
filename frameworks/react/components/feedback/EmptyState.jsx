import React from 'react';
/** Section/screen-level empty state, with a clear action to move forward. */
export function EmptyState({ icon, title, message, action, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12,
      padding: '56px 32px', border: '1px dashed var(--line-strong)', borderRadius: 'var(--r-lg)', background: 'var(--surface-card)', ...style }}>
      {icon && <div style={{ fontSize: 'var(--icon-xl)', color: 'var(--mute)', lineHeight: 1 }}>{icon}</div>}
      {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--bone)' }}>{title}</div>}
      {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--mute)', maxWidth: '42ch', lineHeight: 1.6 }}>{message}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
