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
      background: 'var(--surface-card)', border: '1px solid var(--color-base-300)',
      borderRadius: 'var(--r-lg)', padding: 20, minHeight: 120,
      display: 'flex', flexDirection: 'column', gap: 8, ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mute)' }}>{label}</span>
        {icon && <span aria-hidden="true" style={{ display: 'inline-flex', fontSize: 'var(--icon-sm)', color: 'var(--mute)', opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.1,
        color: 'var(--bone)', fontVariantNumeric: 'tabular-nums', margin: 0,
      }}>{value}</div>
      {delta && (
        <span style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4,
          borderRadius: 'var(--r-pill)', padding: '2px 8px',
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
          background: 'transparent', border: '1px solid ' + t.border, color: t.color,
        }}>
          <i className={delta.direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'} aria-hidden="true" />
          {delta.value}
        </span>
      )}
      {sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--mute)' }}>{sub}</span>}
    </div>
  );
}
