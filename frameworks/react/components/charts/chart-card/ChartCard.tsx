import React from 'react';

export interface ChartCardProps {

  /** The card heading. Absent renders no head unless `actions` is present. */
  title?: string;

  /** Controls in the head row, right-aligned beside the title. */
  actions?: React.ReactNode;
  /** The chart (or any body) the card frames. */
  children?: React.ReactNode;
}


export function ChartCard({ title, actions, children }: ChartCardProps) {
  return (
    <div style={{
      background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
      borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 5)',
      display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 3)',
    }}>
      {(title || actions) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
          {title && <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-label)',
            textTransform: 'uppercase', color: 'var(--mute)',
          }}>{title}</span>}
          {actions && <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)' }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
