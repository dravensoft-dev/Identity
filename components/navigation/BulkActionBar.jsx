import React from 'react';

/** Barra de acciones masivas (H7). Aparece al seleccionar filas y ofrece operar sobre el conjunto.
 * `count`: nº de elementos seleccionados (si es 0 no renderiza). `actions`: [{ label, icon?, onClick, destructive? }]. */
export function BulkActionBar({ count = 0, noun = 'elementos', actions = [], onClear, style }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Acciones sobre la selección"
      style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 52, padding: '0 12px 0 16px',
        background: 'var(--surface-card)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-2)', ...style }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.04em', color: 'var(--bone)' }}>
        <b style={{ color: 'var(--gold)' }}>{count}</b> {noun} {count === 1 ? 'seleccionado' : 'seleccionados'}
      </span>
      <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.onClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px',
              background: 'transparent', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
              color: a.destructive ? 'var(--danger)' : 'var(--bone-dim)',
              transition: 'background var(--dur-fast) var(--ease-out)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {a.icon && <span style={{ fontSize: 16, display: 'inline-flex' }}>{a.icon}</span>}{a.label}
          </button>
        ))}
      </div>
      {onClear && (
        <button onClick={onClear} aria-label="Limpiar selección"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Limpiar
        </button>
      )}
    </div>
  );
}
