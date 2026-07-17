import React, { useState } from 'react';
import { Button } from '../forms/Button.jsx';
/** Confirmation of high-consequence actions. Does NOT close on click-outside (avoids losses).
 * `requireText` forces typing a word to enable the destructive action. */
export function ConfirmDialog({ open, onCancel, onConfirm, title, eyebrow = 'Confirm', children,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, requireText, width = 460 }) {
  const [typed, setTyped] = useState('');
  if (!open) return null;
  const locked = requireText ? typed.trim() !== requireText : false;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--scrim)', backdropFilter: 'blur(var(--scrim-blur))', WebkitBackdropFilter: 'blur(var(--scrim-blur))' }}>
      <div role="alertdialog" aria-modal="true"
        style={{ width, maxWidth: '92vw', background: 'var(--surface-card)', border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: destructive ? 'var(--danger)' : 'var(--crimson)', marginBottom: 8 }}>{eyebrow}</div>
          {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--bone)', letterSpacing: '-.01em' }}>{title}</div>}
        </div>
        <div style={{ padding: '16px 24px', color: 'var(--bone-dim)', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6 }}>
          {children}
          {requireText && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 6 }}>Type "{requireText}" to confirm</div>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus
                style={{ width: '100%', height: 'var(--dz-ctl-h)', boxSizing: 'border-box', padding: '0 12px', background: 'var(--surface-input)',
                  border: '1px solid ' + (locked && typed ? 'var(--danger)' : 'var(--color-base-300)'), borderRadius: 'var(--r-sm)',
                  color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 24px 22px' }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          {/* The point of no return: the only filled danger surface in Arena. Button
            * has no filled-danger variant by design — danger is outline everywhere
            * else, and a variant would put this fill one prop away from any caller.
            * So it stays a local override on the primary button, here and nowhere
            * else. --danger-fill, not --danger: --danger is tuned to be read as
            * text on the base surfaces, which leaves it too light to carry white.
            * --color-error-content, not --on-accent: the fill is danger's, and a
            * swapped skin can pair them differently. */}
          <Button variant="primary" onClick={onConfirm} disabled={locked}
            style={destructive ? { background: 'var(--danger-fill)', color: 'var(--color-error-content)' } : undefined}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
