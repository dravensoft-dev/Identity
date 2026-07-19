import React from 'react';

/** Breadcrumb navigation (H3). Explicit return path in hierarchies deeper than tabs.
 * `items`: [{ label, href?, onClick? }]. The last one is the current location (not navigable). */
export function Breadcrumbs({ items = [], separator = '/', style }) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'calc(var(--sp-1) * 2)', ...style }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const common = { fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-mono-nav)' };
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" style={{ ...common, color: 'var(--bone)', fontWeight: 'var(--fw-bold)' }}>{it.label}</span>
            ) : (
              <a href={it.href || '#'} onClick={it.onClick}
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
