import React from 'react';
import { useContainerWidth, readBreakpoint } from '../../use-container-width.js';

/* Below --bp-sm the row stacks and the actions go full width. Measured on the
 * container, not the viewport: a PageHead inside a narrow panel should stack
 * there too. Width is null until first measure, so the wide layout is the
 * first paint — the narrow branch never flashes. */
export function PageHead({ title, subtitle, actions, align = 'start' }) {
  if (!title) throw new Error('PageHead: `title` is required');
  const [ref, width] = useContainerWidth();
  const narrow = width !== null && width < readBreakpoint('sm');

  return (
    <div ref={ref} style={{
      display: 'flex',
      flexDirection: narrow ? 'column' : 'row',
      alignItems: narrow ? 'stretch' : (align === 'center' ? 'center' : 'flex-start'),
      justifyContent: 'space-between',
      gap: 'calc(var(--sp-1) * 4)',
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-extrabold)', fontSize: 'var(--fs-h1)',
          lineHeight: 'var(--lh-snug)', letterSpacing: 'var(--ls-tight)', color: 'var(--bone)', margin: 0,
        }}>{title}</h1>
        {subtitle && <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: 'var(--mute)',
          margin: 'calc(var(--sp-1) * 0.5) 0 0', lineHeight: 'var(--lh-body)',
        }}>{subtitle}</p>}
      </div>
      {actions && (
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'calc(var(--sp-1) * 2)',
          flexShrink: 0, width: narrow ? '100%' : 'auto',
        }}>{actions}</div>
      )}
    </div>
  );
}
