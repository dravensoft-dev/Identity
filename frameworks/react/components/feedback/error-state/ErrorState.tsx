import React from 'react';
import { Button } from '../../forms/button/Button.tsx';

export interface ErrorStateProps {
  /** A Phosphor class name for the danger glyph Arena draws. */
  icon?: string;
  /** The headline: what failed. */
  title?: string;
  /** A sentence of detail under the title. */
  message?: string;
  /** A diagnostic/support code, shown monospaced. */
  code?: string;
  /** The label of the retry button Arena draws. Absent renders no retry. */
  retryLabel?: string;
  /** The retry button was activated. */
  onRetry?: () => void;
  /** An extra control beside the retry (e.g. a link to logs). */
  secondaryAction?: React.ReactNode;
}


export function ErrorState({ icon, title = 'Something went wrong', message, code, retryLabel, onRetry, secondaryAction }: ErrorStateProps) {
  return (
    <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'calc(var(--sp-1) * 3)',
      padding: 'calc(var(--sp-1) * 14) calc(var(--sp-1) * 8)', border: 'var(--bw) solid var(--danger)', borderRadius: 'var(--r-lg)', background: 'var(--danger-soft)' }}>
      {icon && <div style={{ fontSize: 'var(--icon-xl)', color: 'var(--danger)', lineHeight: 'var(--dz-lh)' }}><i className={icon} aria-hidden="true" /></div>}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h4)', color: 'var(--bone)' }}>{title}</div>
      {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', color: 'var(--bone-dim)', maxWidth: '46ch', lineHeight: 'var(--lh-body)' }}>{message}</div>}
      {code && <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)', background: 'color-mix(in oklab, var(--color-base-100) 30%, transparent)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)', borderRadius: 'var(--r-xs)' }}>{code}</code>}
      <div style={{ display: 'flex', gap: 'calc(var(--sp-1) * 2.5)', marginTop: 'calc(var(--sp-1) * 1.5)' }}>
        {retryLabel && <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>}
        {secondaryAction}
      </div>
    </div>
  );
}
