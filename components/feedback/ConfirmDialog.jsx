import React, { useState } from 'react';
/** Confirmación de acciones de consecuencia alta. NO cierra al hacer clic fuera (evita pérdidas).
 * `requireText` obliga a teclear una palabra para habilitar la acción destructiva. */
export function ConfirmDialog({ open, onCancel, onConfirm, title, eyebrow = 'Confirmar', children,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, requireText, width = 460 }) {
  const [typed, setTyped] = useState('');
  if (!open) return null;
  const locked = requireText ? typed.trim() !== requireText : false;
  const confirmBg = destructive ? 'var(--danger)' : 'var(--crimson)';
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
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 6 }}>Escribe «{requireText}» para confirmar</div>
              <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus
                style={{ width: '100%', height: 42, padding: '0 12px', background: 'var(--surface-input)',
                  border: '1px solid ' + (locked && typed ? 'var(--danger)' : 'var(--line)'), borderRadius: 'var(--r-sm)',
                  color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 24px 22px' }}>
          <button onClick={onCancel} style={{ height: 40, padding: '0 18px', background: 'transparent', color: 'var(--bone-dim)', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{cancelLabel}</button>
          <button onClick={onConfirm} disabled={locked}
            style={{ height: 40, padding: '0 18px', background: confirmBg, color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
