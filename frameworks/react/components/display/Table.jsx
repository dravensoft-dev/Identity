import React from 'react';
import { useContainerWidth, readBreakpoint } from '../../use-container-width.js';

/** Data table. `columns`: [{key, header, align, width, mono, render, mobileLayout}]. `rows`: objects.
 * Reads the density tokens (--dz-*), so inside `.arena-compact` it re-densifies itself.
 * `onRowClick` makes rows interactive.
 *
 * Below --bp-md the table becomes one card per row. The threshold is measured on
 * the CONTAINER, not the viewport: a table inside a narrow card should go
 * card-mode on a wide monitor, and a viewport query gets that wrong. */
export function Table({
  columns = [], rows = [], getRowKey, onRowClick, empty = 'No data.',
  responsive = true, style,
}) {
  const [ref, width] = useContainerWidth();
  // null width → the wide layout. First paint is never the narrow branch.
  const narrow = responsive && width !== null && width < readBreakpoint('md');

  const cellBase = { padding: 'var(--dz-row-py) var(--dz-row-px)', fontSize: 'var(--dz-cell)', textAlign: 'left', verticalAlign: 'middle' };
  const headerLabel = {
    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.12em',
    textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 700,
  };
  const valueStyle = (c) => ({
    fontFamily: c.mono ? 'var(--font-mono)' : 'var(--font-body)',
    color: c.mono ? 'var(--gold)' : 'var(--bone-dim)',
  });
  const cellValue = (c, row) => (c.render ? c.render(row[c.key], row) : row[c.key]);
  const keyOf = (row, ri) => (getRowKey ? getRowKey(row, ri) : ri);

  return (
    <div ref={ref} style={{ width: '100%', ...style }}>
      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rows.length === 0 && (
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--color-base-300)',
              borderRadius: 'var(--r-lg)', padding: '32px 16px', textAlign: 'center',
              color: 'var(--mute)', fontSize: 'var(--dz-cell)' }}>{empty}</div>
          )}
          {rows.map((row, ri) => (
            <div key={keyOf(row, ri)}
              onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
              style={{ background: 'var(--surface-card)', border: '1px solid var(--color-base-300)',
                borderRadius: 'var(--r-lg)', padding: 'var(--dz-row-px)',
                display: 'flex', flexDirection: 'column', gap: 'var(--dz-stack)',
                cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((c) => c.mobileLayout === 'block' ? (
                /* Full width, no label — for the actions column, whose buttons
                   name themselves and would look absurd beside an "ACTIONS" tag. */
                <div key={c.key} style={{ width: '100%', display: 'flex', justifyContent: 'flex-end',
                  gap: 8, borderTop: '1px solid var(--color-base-300)', paddingTop: 8 }}>
                  {cellValue(c, row)}
                </div>
              ) : (
                <div key={c.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <span style={headerLabel}>{c.header}</span>
                  <span style={{ ...valueStyle(c), minWidth: 0, textAlign: 'right', fontSize: 'var(--dz-cell)' }}>
                    {cellValue(c, row)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--color-base-300)', borderRadius: 'var(--r-lg)',
          overflow: 'hidden', background: 'var(--surface-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr style={{ background: 'var(--panel)' }}>
                {columns.map((c) => (
                  <th key={c.key} style={{ ...cellBase, ...headerLabel, textAlign: c.align || 'left',
                    width: c.width, borderBottom: '1px solid var(--color-base-300)' }}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={columns.length} style={{ ...cellBase, textAlign: 'center', color: 'var(--mute)', padding: '32px 16px' }}>{empty}</td></tr>
              )}
              {rows.map((row, ri) => (
                <tr key={keyOf(row, ri)}
                  onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
                  style={{ borderTop: ri === 0 ? 'none' : '1px solid var(--color-base-300)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background var(--dur-fast) var(--ease-out)' }}
                  onMouseEnter={onRowClick ? (e) => (e.currentTarget.style.background = 'var(--panel)') : undefined}
                  onMouseLeave={onRowClick ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ ...cellBase, ...valueStyle(c), textAlign: c.align || 'left' }}>
                      {cellValue(c, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
