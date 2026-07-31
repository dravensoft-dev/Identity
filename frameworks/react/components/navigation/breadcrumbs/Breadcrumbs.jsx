import React from 'react';

export function Breadcrumbs({ items, ariaLabel, separator = '/', onNavigate }) {
  if (!ariaLabel?.trim()) throw new Error('Breadcrumbs: `ariaLabel` is required');
  if (!items) throw new Error('Breadcrumbs: `items` is required');
  return (
    <nav aria-label={ariaLabel} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'calc(var(--sp-1) * 2)' }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const common = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-mono-nav)' };
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" style={{ ...common, color: 'var(--bone)', fontWeight: 'var(--fw-bold)' }}>{it.label}</span>
            ) : (
              <a href={it.href || '#'} onClick={() => onNavigate?.(it)}
                style={{ ...common, color: 'var(--mute)', textDecoration: 'none', cursor: 'pointer', transition: 'color var(--dur-fast) var(--ease-out)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute)')}>
                {it.label}
              </a>
            )}
            {!last && <span aria-hidden="true" style={{ color: 'var(--line-strong)', fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)' }}>{separator}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
