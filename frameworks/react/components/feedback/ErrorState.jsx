import React from 'react';
import { Button } from '../forms/Button.jsx';
/** Section/screen-level error state, with recovery (Retry) and optional detail. */
export function ErrorState({ icon, title = 'Something went wrong', message, code, onRetry, retryLabel = 'Retry', secondaryAction, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'calc(var(--sp-1) * 3)',
      padding: 'calc(var(--sp-1) * 14) calc(var(--sp-1) * 8)', border: 'var(--bw) solid var(--danger)', borderRadius: 'var(--r-lg)', background: 'var(--danger-soft)', ...style }}>
      {icon && <div style={{ fontSize: 'var(--icon-xl)', color: 'var(--danger)', lineHeight: 'var(--dz-lh)' }}>{icon}</div>}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 19, color: 'var(--bone)' }}>{title}</div>
      {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--bone-dim)', maxWidth: '46ch', lineHeight: 'var(--lh-body)' }}>{message}</div>}
      {code && <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', background: 'color-mix(in oklab, var(--color-base-100) 30%, transparent)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)', borderRadius: 'var(--r-xs)' }}>{code}</code>}
      <div style={{ display: 'flex', gap: 'calc(var(--sp-1) * 2.5)', marginTop: 'calc(var(--sp-1) * 1.5)' }}>
        {onRetry && <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>}
        {secondaryAction}
      </div>
    </div>
  );
}
