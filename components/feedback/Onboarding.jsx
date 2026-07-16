import React from 'react';

/** Onboarding guiado (H10). Coachmark por pasos: presenta funciones dentro del producto
 * con progreso, "Saltar" y "Siguiente". Controlado: el host mantiene `index`.
 * `anchorRect` (opcional, un DOMRect) ancla el callout junto a un elemento; sin él flota abajo-derecha. */
export function Onboarding({ open, steps = [], index = 0, onNext, onBack, onSkip, onDone, anchorRect }) {
  if (!open || !steps.length) return null;
  const step = steps[index] || {};
  const last = index === steps.length - 1;
  const W = 320;

  let pos = { position: 'fixed', right: 24, bottom: 24, zIndex: 1200 };
  if (anchorRect) {
    const top = Math.min(anchorRect.bottom + 12, (typeof window !== 'undefined' ? window.innerHeight : 900) - 220);
    let left = anchorRect.left;
    if (typeof window !== 'undefined') left = Math.min(left, window.innerWidth - W - 16);
    pos = { position: 'fixed', top, left: Math.max(16, left), zIndex: 1200 };
  }

  const foot = { fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em' };
  return (
    <>
      <div onClick={onSkip} style={{ position: 'fixed', inset: 0, zIndex: 1190, background: 'rgba(20,16,16,.5)' }} />
      <div role="dialog" aria-modal="true" aria-label={step.title}
        style={{ ...pos, width: W, maxWidth: '92vw', background: 'var(--surface-card)', border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', padding: 20 }}>
        {step.eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 8 }}>{step.eyebrow}</div>}
        {step.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--bone)', letterSpacing: '-.01em' }}>{step.title}</div>}
        {step.body && <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--bone-dim)', marginTop: 8 }}>{step.body}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1 }} aria-label={'Paso ' + (index + 1) + ' de ' + steps.length}>
            {steps.map((_, i) => (
              <span key={i} style={{ width: i === index ? 18 : 7, height: 7, borderRadius: 'var(--r-pill)', background: i === index ? 'var(--crimson)' : 'var(--line-strong)', transition: 'width var(--dur-mid) var(--ease-out)' }} />
            ))}
          </div>
          {index > 0 && (
            <button onClick={onBack} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase' }}>Atrás</button>
          )}
          {!last && (
            <button onClick={onSkip} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase' }}>Saltar</button>
          )}
          <button onClick={last ? onDone : onNext}
            style={{ height: 34, padding: '0 16px', background: 'var(--crimson)', color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {last ? 'Entendido' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
}
