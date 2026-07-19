import React from 'react';

/* The delta pill's color says whether the change is GOOD, not which way it
 * points. Direction and sentiment are separate props because they are separate
 * facts: revenue down is bad, latency down is good, and a component cannot
 * know which metric it is showing. Both signs are outline — filled red belongs
 * to ConfirmDialog's final confirmation and nowhere else. */
const DELTA_TONES = {
  neutral: { border: 'var(--border-strong)', color: 'var(--text-muted)' },
  positive: { border: 'var(--success)', color: 'var(--success)' },
  negative: { border: 'var(--danger)', color: 'var(--danger)' },
};

export function StatCard({ label, value, delta, sub, icon, style, ...rest }) {
  const t = delta ? (DELTA_TONES[delta.tone] || DELTA_TONES.neutral) : null;
  return (
    <div style={{
      background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
      borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 5)', minHeight: 'calc(var(--sp-1) * 30)',
      display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 2)', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--mute)' }}>{label}</span>
        {icon && <span aria-hidden="true" style={{ display: 'inline-flex', fontSize: 'var(--icon-sm)', color: 'var(--mute)', opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 32, lineHeight: 'var(--lh-snug)',
        color: 'var(--bone)', fontVariantNumeric: 'tabular-nums', margin: 0,
      }}>{value}</div>
      {delta && (
        <span style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1)',
          borderRadius: 'var(--r-pill)', padding: 'calc(var(--sp-1) * 0.5) calc(var(--sp-1) * 2)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', fontWeight: 'var(--fw-semibold)',
          background: 'transparent', border: 'var(--bw) solid ' + t.border, color: t.color,
        }}>
          <i className={delta.direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'} aria-hidden="true" />
          {delta.value}
        </span>
      )}
      {sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-sm)', color: 'var(--mute)' }}>{sub}</span>}
    </div>
  );
}
