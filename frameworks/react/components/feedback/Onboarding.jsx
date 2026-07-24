import React from 'react';
import { onboardingWidth, sp3, sp4 } from '../../tokens.generated.js';

/** Guided onboarding (H10). Step-by-step coachmark: presents features within the product
 * with progress, "Skip", and "Next". Controlled: the host keeps `index`.
 * `anchor` (optional) anchors the callout next to an element by its left and bottom
 * viewport coordinates; a DOMRect satisfies it. Without it the coachmark floats bottom-right. */
export function Onboarding({ open, steps, index = 0, onNext, onBack, onSkip, onDone, anchor }) {
  if (open == null) throw new Error('Onboarding: `open` is required');
  if (steps == null) throw new Error('Onboarding: `steps` is required');
  if (!open || !steps.length) return null;
  const step = steps[index] || {};
  const last = index === steps.length - 1;
  // The popover's own geometry, from tokens/src/. These were plain constants
  // because Math.min/Math.max need real numbers; they are still real numbers,
  // but authored once in tokens/src/ instead of here and in Angular's copy.
  const W = onboardingWidth;
  const EDGE = sp4;

  let pos = { position: 'fixed', right: 'calc(var(--sp-1) * 6)', bottom: 'calc(var(--sp-1) * 6)', zIndex: 'var(--z-onboarding)' };
  if (anchor) {
    // Two plain numbers remain here, both arithmetic on a DOMRect and on
    // window.innerHeight:
    //   220 -- a floor estimate of the popover's own height, so a callout
    //          anchored near the bottom of the viewport is not pushed below
    //          the fold. It is deliberately an over-estimate: too high only
    //          lifts the popover, too low would clip it.
    //   900 -- the assumed viewport height before mount, where there is no
    //          window to measure. Not a design value; the charts make the
    //          same assumption about width.
    const top = Math.min(anchor.bottom + sp3, (typeof window !== 'undefined' ? window.innerHeight : 900) - 220);
    let left = anchor.left;
    if (typeof window !== 'undefined') left = Math.min(left, window.innerWidth - W - EDGE);
    pos = { position: 'fixed', top, left: Math.max(EDGE, left), zIndex: 'var(--z-onboarding)' };
  }

  const foot = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-uppercase-status)' };
  return (
    <>
      {/* The scrim sits just under the coachmark -- one slot, two uses, so the
        * relationship is expressed as a derivation at the point of use rather
        * than a second token. */}
      <div onClick={onSkip} style={{ position: 'fixed', inset: 0, zIndex: 'calc(var(--z-onboarding) - 10)', background: 'var(--scrim)' }} />
      <div role="dialog" aria-modal="true" aria-label={step.title}
        style={{ ...pos, width: 'var(--onboarding-width)', maxWidth: '92vw', background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', padding: 'calc(var(--sp-1) * 5)' }}>
        {step.eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 2)' }}>{step.eyebrow}</div>}
        {step.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h4)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{step.title}</div>}
        {step.body && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)', color: 'var(--bone-dim)', marginTop: 'calc(var(--sp-1) * 2)' }}>{step.body}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', marginTop: 'calc(var(--sp-1) * 4.5)' }}>
          <div style={{ display: 'flex', gap: 'calc(var(--sp-1) * 1.5)', flex: 1 }} aria-label={'Step ' + (index + 1) + ' of ' + steps.length}>
            {steps.map((_, i) => (
              <span key={i} style={{ width: i === index ? 'calc(var(--sp-1) * 4.5)' : 'var(--sp-2)', height: 'calc(var(--sp-1) * 2)', borderRadius: 'var(--r-pill)', background: i === index ? 'var(--crimson)' : 'var(--line-strong)', transition: 'width var(--dur-mid) var(--ease-out)' }} />
            ))}
          </div>
          {index > 0 && (
            <button onClick={onBack} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase' }}>Back</button>
          )}
          {!last && (
            <button onClick={onSkip} style={{ ...foot, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase' }}>Skip</button>
          )}
          <button onClick={last ? onDone : onNext}
            style={{ height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 4)', background: 'var(--crimson)', color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text-md)', cursor: 'pointer' }}>
            {last ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
