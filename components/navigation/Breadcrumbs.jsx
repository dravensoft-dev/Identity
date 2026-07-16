import React from 'react';

/** Migas de navegación (H3). Ruta de retorno explícita en jerarquías profundas, más allá de las pestañas.
 * `items`: [{ label, href?, onClick? }]. El último es la ubicación actual (no navegable). */
export function Breadcrumbs({ items = [], separator = '/', style }) {
  return (
    <nav aria-label="Ruta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, ...style }}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const common = { fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.04em' };
        return (
          <React.Fragment key={i}>
            {last ? (
              <span aria-current="page" style={{ ...common, color: 'var(--bone)', fontWeight: 700 }}>{it.label}</span>
            ) : (
              <a href={it.href || '#'} onClick={it.onClick}
                style={{ ...common, color: 'var(--mute)', textDecoration: 'none', cursor: 'pointer', transition: 'color var(--dur-fast) var(--ease-out)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bone-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute)')}>
                {it.label}
              </a>
            )}
            {!last && <span aria-hidden="true" style={{ color: 'var(--line-strong)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{separator}</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
