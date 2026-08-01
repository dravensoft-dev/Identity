import React, { useRef } from 'react';
import { onboardingWidth, onboardingHeightReserve, sp3, sp4 } from '../../../Tokens.generated.js';

const SSR_VIEWPORT_H = 900;
import { useDialogModal } from '../../../UseDialogModal.ts';

import type { OnboardingStep, OnboardingAnchor } from '../../../Api.generated';

export type { OnboardingStep };

export interface OnboardingProps {

  /** Whether the tour is shown. Closed renders nothing, scrim included. */
  open: boolean;

  /** The tour, in order. An empty tour renders nothing. */
  steps: OnboardingStep[];

  /** Which step is current. The host owns it and answers next/back. */
  index?: number;

  /** Where to attach the coachmark, as the two viewport coordinates it positions from. Absent floats it bottom-right. */
  anchor?: OnboardingAnchor;

  /** Next was activated on a step that is not the last. */
  onNext?: () => void;

  /** Back was activated on a step that is not the first. */
  onBack?: () => void;

  /** Skip was activated, or the scrim was clicked. */
  onSkip?: () => void;

  /** The final step's confirming control was activated. */
  onDone?: () => void;
}


export function Onboarding({ open, steps, index = 0, onNext, onBack, onSkip, onDone, anchor }: OnboardingProps) {
  if (open == null) throw new Error('Onboarding: `open` is required');
  if (steps == null) throw new Error('Onboarding: `steps` is required');

  const panelRef = useRef<HTMLDivElement | null>(null);
  const onKeyDown = useDialogModal({ open, panelRef, onDismiss: onSkip });
  if (!open || !steps.length) return null;
  const step = steps[index] || {};
  const last = index === steps.length - 1;

  const label = step.title ?? step.eyebrow ?? `Step ${index + 1} of ${steps.length}`;

  const W = onboardingWidth;
  const EDGE = sp4;

  let pos: React.CSSProperties = { position: 'fixed', right: 'calc(var(--sp-1) * 6)', bottom: 'calc(var(--sp-1) * 6)', zIndex: 'var(--z-onboarding)' };
  if (anchor) {

    const top = Math.min(anchor.bottom + sp3, (typeof window !== 'undefined' ? window.innerHeight : SSR_VIEWPORT_H) - onboardingHeightReserve);
    let left = anchor.left;
    if (typeof window !== 'undefined') left = Math.min(left, window.innerWidth - W - EDGE);
    pos = { position: 'fixed', top, left: Math.max(EDGE, left), zIndex: 'var(--z-onboarding)' };
  }

  const foot: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-uppercase-status)' };
  return (
    <div onClick={onSkip} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-onboarding)', background: 'var(--scrim)' }}>
      <div role="dialog" aria-modal="true" aria-label={label}
        ref={panelRef} tabIndex={-1} onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()}
        style={{ ...pos, width: 'var(--onboarding-width)', maxWidth: '92vw', background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-3)', padding: 'calc(var(--sp-1) * 5)' }}>
        {step.eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--crimson)', marginBottom: 'calc(var(--sp-1) * 2)' }}>{step.eyebrow}</div>}
        {step.title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h4)', color: 'var(--bone)', letterSpacing: 'var(--ls-tight)' }}>{step.title}</div>}
        {step.body && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh-body)', color: 'var(--bone-dim)', marginTop: 'calc(var(--sp-1) * 2)' }}>{step.body}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', marginTop: 'calc(var(--sp-1) * 4.5)' }}>
          <div style={{ display: 'flex', gap: 'calc(var(--sp-1) * 1.5)', flex: 1 }} aria-label={'Progress: step ' + (index + 1) + ' of ' + steps.length}>
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
    </div>
  );
}
