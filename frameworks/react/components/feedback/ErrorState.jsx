import React from 'react';
import { Button } from '../forms/Button.jsx';
/** Section/screen-level error state, with recovery (Retry) and optional detail. */
export function ErrorState({ icon, title = 'Something went wrong', message, code, onRetry, retryLabel = 'Retry', secondaryAction, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12,
      padding: '56px 32px', border: '1px solid var(--danger)', borderRadius: 'var(--r-lg)', background: 'var(--danger-soft)', ...style }}>
      {icon && <div style={{ fontSize: 'var(--icon-xl)', color: 'var(--danger)', lineHeight: 1 }}>{icon}</div>}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--bone)' }}>{title}</div>
      {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--bone-dim)', maxWidth: '46ch', lineHeight: 1.6 }}>{message}</div>}
      {code && <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', background: 'color-mix(in oklab, var(--color-base-100) 30%, transparent)', padding: '4px 10px', borderRadius: 'var(--r-xs)' }}>{code}</code>}
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        {onRetry && <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>}
        {secondaryAction}
      </div>
    </div>
  );
}
