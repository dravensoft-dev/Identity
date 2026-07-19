import React from 'react';

/* The card a chart sits on. `title` is an uppercase muted microlabel, NOT a
 * heading element: a dashboard is a grid of tiles, and emitting an h2 per tile
 * would fabricate a document outline nobody asked for. The chart's own
 * role="img" carries the accessible name. */
export function ChartCard({ title, actions, children, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--color-base-300)',
      borderRadius: 'var(--r-lg)', padding: 20,
      display: 'flex', flexDirection: 'column', gap: 12, ...style,
    }} {...rest}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {title && <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: '.2em',
            textTransform: 'uppercase', color: 'var(--mute)',
          }}>{title}</span>}
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
