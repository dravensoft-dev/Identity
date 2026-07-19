import React from 'react';
const TONES = {
  neutral: ['var(--color-base-300)', 'var(--bone-dim)'],
  accent: ['var(--crimson-soft)', 'var(--crimson)'],
  gold: ['var(--gold-soft)', 'var(--gold)'],
  success: ['var(--success-soft)', 'var(--success)'],
  warning: ['var(--warning-soft)', 'var(--warning)'],
  danger: ['var(--danger-soft)', 'var(--danger)'],
  info: ['var(--info-soft)', 'var(--info)'],
};
export function Badge({ children, tone = 'neutral', dot = false, style, ...rest }) {
  const [bg, fg] = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
      background: bg, color: fg, borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', ...style }} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg }} />}
      {children}
    </span>
  );
}
