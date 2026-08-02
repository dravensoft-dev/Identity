import React from 'react';

import type { Tone } from '../../../Api.generated';

export interface BadgeProps {

  /** The label text. Short: a badge is a chip, not a sentence. */
  children?: React.ReactNode;
  /** System status (success/warning/danger/info) reflects an object's actual state; emphasis (accent, gold) is editorial; neutral carries no semantic weight. */
  tone?: Tone;

  /** Draws a filled dot in the tone colour before the label. */
  dot?: boolean;
}

const TONES = {
  neutral: ['var(--color-base-300)', 'var(--bone-dim)'],
  accent: ['var(--crimson-soft)', 'var(--crimson)'],
  gold: ['var(--gold-soft)', 'var(--gold)'],
  success: ['var(--success-soft)', 'var(--success)'],
  warning: ['var(--warning-soft)', 'var(--warning)'],
  danger: ['var(--danger-soft)', 'var(--danger)'],
  info: ['var(--info-soft)', 'var(--info)'],
};
export function Badge({ children, tone = 'neutral', dot = false }: BadgeProps) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', padding: 'calc(var(--sp-1) * 1) calc(var(--sp-1) * 2.5)',
      background: bg, color: fg, borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase' }}>
      {dot && <span style={{ width: 'calc(var(--sp-1) * 1.5)', height: 'calc(var(--sp-1) * 1.5)', borderRadius: '50%', background: fg }} />}
      {children}
    </span>
  );
}
