import React from 'react';
const TOAST_TONES = { neutral: 'var(--line-strong)', success: 'var(--success)', danger: 'var(--danger)', gold: 'var(--gold)' };
/** Notificación efímera. `action` añade un botón (Deshacer / Reintentar / Ver logs).
 * `persist` (H1): desactiva el autodescarte del host — obligatorio en estados crítico/error
 * para que no desaparezcan antes de leerse; solo se cierran con la × o una acción. */
export function Toast({ title, message, tone = 'neutral', action, onClose, persist = false, style }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} aria-live={tone === 'danger' ? 'assertive' : 'polite'} data-persist={persist ? '' : undefined}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: 340, padding: '14px 16px',
      background: 'var(--surface-card)', border: '1px solid var(--line)',
      borderLeft: '3px solid ' + (TOAST_TONES[tone] || TOAST_TONES.neutral), borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-2)', ...style }}>
      <div style={{ flex: 1 }}>
        {title && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--bone)' }}>{title}{persist && <span title="No se autodescarta" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.12em', color: 'var(--mute)', border: '1px solid var(--line)', borderRadius: 'var(--r-xs)', padding: '1px 5px', textTransform: 'uppercase' }}>Fijo</span>}</div>}
        {message && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--mute)', marginTop: 2 }}>{message}</div>}
        {action && (
          <button onClick={action.onClick}
            style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              color: tone === 'danger' ? 'var(--gold)' : 'var(--crimson)' }}>
            {action.label}
          </button>
        )}
      </div>
      {onClose && <button onClick={onClose} aria-label="Cerrar" style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', color: 'var(--mute)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}><i className="ph-bold ph-x" /></button>}
    </div>
  );
}
