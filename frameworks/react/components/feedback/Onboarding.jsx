import React from 'react';

/** Guided onboarding (H10). Step-by-step coachmark: presents features within the product
 * with progress, "Skip", and "Next". Controlled: the host keeps `index`.
 * `anchorRect` (optional, a DOMRect) anchors the callout next to an element; without it floats bottom-right. */
export function Onboarding({ open, steps = [], index = 0, onNext, onBack, onSkip, onDone, anchorRect }) {
  if (!open || !steps.length) return null;
  const step = steps[index] || {};
  const last = index === steps.length - 1;
  const W = 320;

  let pos = { position: 'fixed', right: 24, bottom: 24, zIndex: 'var(--z-onboarding)' };
  if (anchorRect) {
    const top = Math.min(anchorRect.bottom + 12, (typeof window !== 'undefined' ? window.innerHeight : 900) - 220);
    let left = anchorRect.left;
    if (typeof window !== 'undefined') left = Math.min(left, window.innerWidth - W - 16);
    pos = { position: 'fixed', top, left: Math.max(16, left), zIndex: 'var(--z-onboarding)' };
  }

  const foot = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: '.06em' };
  return (
    <>
      {/* The scrim sits just under the coachmark -- one slot, two uses, so the
        * relationship is expressed as a derivation at the point of use rather
        * than a second token. */}
      <div onClick={onSkip} style={{ position: 'fixed', inset: 0, zIndex: 'calc(var(--z-onboarding) - 10)', background: 'var(--scrim)' }} />
      <div role="dialog" aria-modal="true" aria-label={step.title}
        style={{ ...pos, width: W, maxWidth: '92vw', background: 'var(--surface-card)', border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', padding: 20 }}>
        {step.eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 8 }}>{step.eyebrow}</div>}
        {step.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--bone)', letterSpacing: '-.01em' }}>{step.title}</div>}
        {step.body && <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--bone-dim)', marginTop: 8 }}>{step.body}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1 }} aria-label={'Step ' + (index + 1) + ' of ' + steps.length}>
            {steps.map((_, i) => (
              <span key={i} style={{ width: i === index ? 18 : 7, height: 7, borderRadius: 'var(--r-pill)', background: i === index ? 'var(--crimson)' : 'var(--line-strong)', transition: 'width var(--dur-mid) var(--ease-out)' }} />
            ))}
          </div>
          {index > 0 && (
            <button onClick={onBack} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase' }}>Back</button>
          )}
          {!last && (
            <button onClick={onSkip} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 700, textTransform: 'uppercase' }}>Skip</button>
          )}
          <button onClick={last ? onDone : onNext}
            style={{ height: 34, padding: '0 16px', background: 'var(--crimson)', color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--dz-text-md)', cursor: 'pointer' }}>
            {last ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
