import React from 'react';
/** Data table. `columns`: [{key, header, align, width, mono, render}]. `rows`: objects.
 * Reads the density tokens (--dz-*), so inside `.arena-compact` it re-densifies itself.
 * `onRowClick` makes rows interactive; `selectable` reserves the first column. */
export function Table({ columns = [], rows = [], getRowKey, onRowClick, empty = 'No data.', style }) {
  const cellBase = { padding: 'var(--dz-row-py) var(--dz-row-px)', fontSize: 'var(--dz-cell)', textAlign: 'left', verticalAlign: 'middle' };
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface-card)', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr style={{ background: 'var(--panel)' }}>
            {columns.map((c) => (
              <th key={c.key} style={{ ...cellBase, textAlign: c.align || 'left', width: c.width,
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
                color: 'var(--mute)', fontWeight: 700, borderBottom: '1px solid var(--line)' }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} style={{ ...cellBase, textAlign: 'center', color: 'var(--mute)', padding: '32px 16px' }}>{empty}</td></tr>
          )}
          {rows.map((row, ri) => (
            <tr key={getRowKey ? getRowKey(row, ri) : ri}
              onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
              style={{ borderTop: ri === 0 ? 'none' : '1px solid var(--line)', cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background var(--dur-fast) var(--ease-out)' }}
              onMouseEnter={onRowClick ? (e) => (e.currentTarget.style.background = 'var(--panel)') : undefined}
              onMouseLeave={onRowClick ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
              {columns.map((c) => (
                <td key={c.key} style={{ ...cellBase, textAlign: c.align || 'left',
                  fontFamily: c.mono ? 'var(--font-mono)' : 'var(--font-body)',
                  color: c.mono ? 'var(--gold)' : 'var(--bone-dim)' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
