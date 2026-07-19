import React from 'react';

/* The card a chart sits on. `title` is an uppercase muted microlabel, NOT a
 * heading element: a dashboard is a grid of tiles, and emitting an h2 per tile
 * would fabricate a document outline nobody asked for. The chart's own
 * role="img" carries the accessible name. */
export function ChartCard({ title, actions, children, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
      borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 5)',
      display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)', ...style,
    }} {...rest}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
          {title && <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-label)',
            textTransform: 'uppercase', color: 'var(--mute)',
          }}>{title}</span>}
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)' }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
