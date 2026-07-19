import React from 'react';

/** Bulk actions bar (H7). Appears when rows are selected and offers to operate on the set.
 * `count`: number of selected items (does not render if 0). `actions`: [{ label, icon?, onClick, destructive? }]. */
export function BulkActionBar({ count = 0, noun = 'items', actions = [], onClear, style }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Actions on the selection"
      style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3.5)', minHeight: 'calc(var(--sp-1) * 13)', padding: '0 calc(var(--sp-1) * 3) 0 calc(var(--sp-1) * 4)',
        background: 'var(--surface-card)', border: 'var(--bw) solid var(--line-strong)', borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-2)', ...style }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: 'var(--ls-mono-nav)', color: 'var(--bone)' }}>
        <b style={{ color: 'var(--gold)' }}>{count}</b> {noun} selected
      </span>
      <span style={{ width: 'var(--bw)', height: 'calc(var(--sp-1) * 5.5)', background: 'var(--color-base-300)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 1.5)', flex: 1, flexWrap: 'wrap' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.onClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 2)', height: 'calc(var(--sp-1) * 8.5)', padding: '0 calc(var(--sp-1) * 3)',
              background: 'transparent', border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--dz-text-md)',
              color: a.destructive ? 'var(--danger)' : 'var(--bone-dim)',
              transition: 'background var(--dur-fast) var(--ease-out)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            {a.icon && <span style={{ fontSize: 'var(--icon-md)', display: 'inline-flex' }}>{a.icon}</span>}{a.label}
          </button>
        ))}
      </div>
      {onClear && (
        <button onClick={onClear} aria-label="Clear selection"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mute)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase' }}>
          Clear
        </button>
      )}
    </div>
  );
}
