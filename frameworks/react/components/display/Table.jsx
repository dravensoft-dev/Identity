import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../use-container-width.js';

/** Data table. `columns`: [{key, header, align, width, mono, render, mobileLayout}]. `rows`: objects.
 * Reads the density tokens (--dz-*), so inside `.arena-compact` it re-densifies itself.
 * `onRowClick` makes rows interactive.
 *
 * `label` names the grid for assistive technology and is REQUIRED. A data table
 * has nothing to derive a name from — Calendar names its grid from the range it
 * is showing, and a table's subject is editorial. A constant fallback was
 * rejected: an unnamed role="grid" is worse than a generic progressbar.
 *
 * Below --bp-md the table becomes one card per row. The threshold is measured on
 * the CONTAINER, not the viewport: a table inside a narrow card should go
 * card-mode on a wide monitor, and a viewport query gets that wrong. */
export function Table({
  columns = [], rows = [], getRowKey, onRowClick, empty = 'No data.',
  responsive = true, label, style,
}) {
  if (!label) throw new Error('Table: `label` is required');
  const [ref, width] = useContainerWidth();
  // null width → the wide layout. First paint is never the narrow branch.
  const narrow = responsive && width !== null && width < readBreakpoint('md');

  const cellBase = { padding: 'var(--dz-row-py) var(--dz-row-px)', fontSize: 'var(--dz-text)', textAlign: 'left', verticalAlign: 'middle' };
  const headerLabel = {
    fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-column-header)',
    textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 'var(--fw-bold)',
  };
  const valueStyle = (c) => ({
    fontFamily: c.mono ? 'var(--font-mono)' : 'var(--font-body)',
    color: c.mono ? 'var(--gold)' : 'var(--bone-dim)',
  });
  const cellValue = (c, row) => (c.render ? c.render(row[c.key], row) : row[c.key]);
  const keyOf = (row, ri) => (getRowKey ? getRowKey(row, ri) : ri);

  /* ------------------------------------------------------------------ *
   * Keyboard navigation of the grid — the WIDE layout only.
   *
   * The header row is ROW 0 of the navigable grid. APG's grid includes the
   * column headers among the navigable cells, and it is also the only shape
   * that guarantees a tab stop exists at all: a table whose body is empty
   * still has headers, and a grid with no reachable cell is not a grid.
   *
   * ROW LENGTHS GENUINELY DIFFER, so the grid is modelled rather than assumed
   * rectangular: the empty state renders ONE <td colSpan={columns.length}>,
   * and a cursor clamped against `columns.length` there would point at a cell
   * that does not exist. `rowLens` is the model and the cursor is clamped
   * against it at render, the way Calendar clamps curDay/curHour, because the
   * rows change under the cursor whenever the consumer's data does.
   * ------------------------------------------------------------------ */
  const gridRef = useRef(null);
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });

  const rowLens = useMemo(() => [
    columns.length,
    ...(rows.length === 0 ? [1] : rows.map(() => columns.length)),
  ], [columns.length, rows.length]);

  const curRow = Math.min(Math.max(cursor.row, 0), Math.max(rowLens.length - 1, 0));
  const curCol = Math.min(Math.max(cursor.col, 0), Math.max((rowLens[curRow] || 0) - 1, 0));

  /* Move DOM focus only when the grid ALREADY holds it. On mount
     document.activeElement is <body>, so a table on a page steals nothing;
     once a cell has been focused the roving stop follows the cursor. */
  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const active = g.ownerDocument.activeElement;
    if (!active || !g.contains(active)) return;
    const cell = g.querySelector('[role="gridcell"][tabindex="0"], [role="columnheader"][tabindex="0"]');
    if (cell && cell !== active) cell.focus();
  }, [curRow, curCol]);

  const onGridKeyDown = (e) => {
    const t = e.target;
    if (!t || typeof t.getAttribute !== 'function') return;
    const role = t.getAttribute('role');
    /* A control the consumer drew inside a cell is NOT a cell, and its keys are
       its own. Arena reads the role rather than the tag so a consumer's <td>
       content can never be mistaken for the grid's own. */
    if (role !== 'gridcell' && role !== 'columnheader') return;

    let row = curRow;
    let col = curCol;
    if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
    else if (e.key === 'ArrowDown') row = Math.min(rowLens.length - 1, row + 1);
    else if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
    else if (e.key === 'ArrowRight') col = Math.min(Math.max((rowLens[row] || 1) - 1, 0), col + 1);
    /* Home and End stay INSIDE the current row: its first and last cell, never
       the first row of the grid. grid.json says "the current row" for both, and
       resetting the other axis as well would move focus convincingly and to the
       wrong cell. */
    else if (e.key === 'Home') col = 0;
    else if (e.key === 'End') col = Math.max((rowLens[row] || 1) - 1, 0);
    else if (e.key === 'Enter') {
      /* Enter activates the row, and there is NO step-in to add. Calendar needed
         one because it had silenced its event blocks with tabIndex={-1}; Table
         silences nothing, so a consumer's cell button stays Tab-reachable and no
         capability is lost. Row 0 is the header and activates nothing. */
      e.preventDefault();
      if (onRowClick && curRow > 0 && rows.length > 0) onRowClick(rows[curRow - 1], curRow - 1);
      return;
    } else return;

    // A vertical move can land in a shorter row — the empty state is one cell wide.
    col = Math.min(col, Math.max((rowLens[row] || 1) - 1, 0));
    /* preventDefault whether or not the cursor moves: the key was handled, and
       letting it through would scroll the box under a cursor that just refused
       to move. */
    e.preventDefault();
    /* Bail out when the clamp landed where the cursor already was. A fresh object
       always fails Object.is, so without this an arrow held down at an edge
       re-renders the whole table once per repeat to move nothing. */
    if (row !== curRow || col !== curCol) setCursor({ row, col });
  };

  /* The cursor cell is the grid's one tab stop; every other cell is -1. The ring
     is an INSET box-shadow: a border would grow the content box, and an outward
     ring would be clipped by the wrapper's overflow:hidden. */
  const cellNav = (ri, ci) => ({
    tabIndex: ri === curRow && ci === curCol ? 0 : -1,
    /* A cell reached by pointer takes the cursor with it; the same bail-out as
       the key handler, because the effect above focuses the cursor cell and its
       focus event would otherwise re-render the grid a second time per move. */
    onFocus: () => { if (ri !== curRow || ci !== curCol) setCursor({ row: ri, col: ci }); },
  });
  const cellRing = (ri, ci) => ({
    outline: 'none',
    boxShadow: ri === curRow && ci === curCol && gridFocused
      ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined,
  });

  return (
    <div ref={ref} style={{ width: '100%', ...style }}>
      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          {rows.length === 0 && (
            <div style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
              borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)', textAlign: 'center',
              color: 'var(--mute)', fontSize: 'var(--dz-text)' }}>{empty}</div>
          )}
          {rows.map((row, ri) => (
            <div key={keyOf(row, ri)}
              onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
              style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
                borderRadius: 'var(--r-lg)', padding: 'var(--dz-row-px)',
                display: 'flex', flexDirection: 'column', gap: 'var(--dz-stack)',
                cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map((c) => c.mobileLayout === 'block' ? (
                /* Full width, no label — for the actions column, whose buttons
                   name themselves and would look absurd beside an "ACTIONS" tag. */
                <div key={c.key} style={{ width: '100%', display: 'flex', justifyContent: 'flex-end',
                  gap: 'calc(var(--sp-1) * 2)', borderTop: 'var(--bw) solid var(--color-base-300)', paddingTop: 'calc(var(--sp-1) * 2)' }}>
                  {cellValue(c, row)}
                </div>
              ) : (
                <div key={c.key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
                  <span style={headerLabel}>{c.header}</span>
                  <span style={{ ...valueStyle(c), minWidth: 0, textAlign: 'right', fontSize: 'var(--dz-text)' }}>
                    {cellValue(c, row)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)',
          overflow: 'hidden', background: 'var(--surface-card)' }}>
          {/* The grid is the <table> itself: its rows are its <tr>s and its cells
              are their <th>/<td>s, so grid > row > cell needs no extra element
              and no role="presentation" anywhere. */}
          <table role="grid" aria-label={label} ref={gridRef}
            onKeyDown={onGridKeyDown}
            onFocus={() => setGridFocused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setGridFocused(false); }}
            style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr role="row" style={{ background: 'var(--panel)' }}>
                {columns.map((c, ci) => (
                  <th key={c.key} role="columnheader" {...cellNav(0, ci)}
                    style={{ ...cellBase, ...headerLabel, textAlign: c.align || 'left',
                      width: c.width, borderBottom: 'var(--bw) solid var(--color-base-300)',
                      ...cellRing(0, ci) }}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr role="row"><td role="gridcell" colSpan={columns.length} {...cellNav(1, 0)}
                  style={{ ...cellBase, textAlign: 'center', color: 'var(--mute)',
                    padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)', ...cellRing(1, 0) }}>{empty}</td></tr>
              )}
              {rows.map((row, ri) => (
                <tr key={keyOf(row, ri)} role="row"
                  onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
                  style={{ borderTop: ri === 0 ? 'none' : 'var(--bw) solid var(--color-base-300)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background var(--dur-fast) var(--ease-out)' }}
                  onMouseEnter={onRowClick ? (e) => (e.currentTarget.style.background = 'var(--panel)') : undefined}
                  onMouseLeave={onRowClick ? (e) => (e.currentTarget.style.background = 'transparent') : undefined}>
                  {columns.map((c, ci) => (
                    <td key={c.key} role="gridcell" {...cellNav(ri + 1, ci)}
                      style={{ ...cellBase, ...valueStyle(c), textAlign: c.align || 'left', ...cellRing(ri + 1, ci) }}>
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
