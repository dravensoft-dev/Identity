import React from 'react';

/** Bulk actions bar (H7). Appears when rows are selected and offers to operate on the set.
 * `count`: number of selected items (does not render if 0). `actions`: [{ label, icon?, onClick, destructive? }]. */
export function BulkActionBar({ count = 0, noun = 'items', actions = [], onClear, style }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Actions on the selection"
      style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 52, padding: '0 12px 0 16px',
        background: 'var(--surface-card)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-2)', ...style }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-sm)', letterSpacing: '.04em', color: 'var(--bone)' }}>
        <b style={{ color: 'var(--gold)' }}>{count}</b> {noun} selected
      </span>
      <span style={{ width: 1, height: 22, background: 'var(--color-base-300)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.onClick}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 12px',
              background: 'transparent', border: '1px solid var(--color-base-300)', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--dz-text-md)',
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
            fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Clear
        </button>
      )}
    </div>
  );
}
