import React, { useEffect, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../use-container-width.js';
import { HEADER_LABEL, CELL_BASE } from './TableCell.jsx';

/** Data table. A COMPOUND component: `columns` says how each column is headed
 * and set, and the consumer writes one `<TableRow>` per row with one
 * `<TableCell>` per cell inside it.
 *
 * WHY IT IS COMPOUND, because it used not to be. `TableColumn` carried a
 * `render` function and Arena called it once per cell — per-item projection, the
 * shape the convention that removed `ActivityFeed.renderItem` and
 * `Calendar.renderEvent` forbids, because Angular has no answer for it short of
 * a structural directive and `ngTemplateOutlet`. Deleting `render` and nothing
 * else would have deleted the badge from every status cell and the button from
 * every actions cell. Making the item a component keeps both and needs no new
 * form in the API vocabulary at all: a cell the consumer instantiates is one
 * element they wrote, exactly as `CalendarEvent` is.
 *
 * Reads the density tokens (--dz-*), so inside `.arena-compact` it re-densifies
 * itself.
 *
 * `label` names the grid for assistive technology and is REQUIRED. A data table
 * has nothing to derive a name from — Calendar names its grid from the range it
 * is showing, and a table's subject is editorial. A constant fallback was
 * rejected: an unnamed role="grid" is worse than a generic progressbar.
 *
 * Below --bp-md the table becomes one card per row. The threshold is measured on
 * the CONTAINER, not the viewport: a table inside a narrow card should go
 * card-mode on a wide monitor, and a viewport query gets that wrong. */
export function Table({ columns = [], children, empty = 'No data.', responsive = true, label }) {
  if (!label) throw new Error('Table: `label` is required');
  const [ref, width] = useContainerWidth();
  // null width → the wide layout. First paint is never the narrow branch.
  const narrow = responsive && width !== null && width < readBreakpoint('md');

  /* The rows are the consumer's own elements. `toArray` gives every one of them
     a key (so cloning below never warns) and drops null/undefined/booleans, so
     a conditionally-rendered row is absent rather than counted. */
  const rowEls = React.Children.toArray(children);

  /* ------------------------------------------------------------------ *
   * Keyboard navigation of the grid — the WIDE layout only.
   *
   * The header row is ROW 0 of the navigable grid. APG's grid includes the
   * column headers among the navigable cells, and it is also the only shape
   * that guarantees a tab stop exists at all: a table whose body is empty
   * still has headers, and a grid with no reachable cell is not a grid.
   *
   * ROW LENGTHS GENUINELY DIFFER, and under the compound shape they differ for
   * a second reason as well as the first. The empty state renders ONE
   * <td colSpan={columns.length}>; and a consumer's row may carry a different
   * number of cells than there are columns, because nothing forces them to
   * match and Arena will not silently invent or drop one. So the grid is
   * MODELLED rather than assumed rectangular: `rowLens` is that model and the
   * cursor is clamped against it at render, the way Calendar clamps
   * curDay/curHour, because the rows change under the cursor whenever the
   * consumer's markup does.
   * ------------------------------------------------------------------ */
  const gridRef = useRef(null);
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });

  /* Counted the same way TableRow lays them out -- see its own comment. Built
     on every render rather than memoised: it is a walk of the children React
     just handed us, its inputs are those children themselves, and a memo would
     need a dependency that recomputes the walk to find out whether it changed. */
  const cellCounts = rowEls.map((row) => (
    React.isValidElement(row) ? React.Children.toArray(row.props.children).length : 0
  ));
  const rowLens = [columns.length, ...(rowEls.length === 0 ? [1] : cellCounts)];

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
    /* Focus is inside a cell's CONTENT rather than on a cell -- a control the
       consumer drew. Moving the roving stop is ours; taking focus off their
       control is not. The cursor can move while focus sits there without any
       help from the focus handler below: the consumer's markup changes and the
       clamp moves it, and the theft would be silent. */
    const activeRole = active.getAttribute && active.getAttribute('role');
    if (activeRole !== 'gridcell' && activeRole !== 'columnheader') return;
    const cell = g.querySelector('[role="gridcell"][tabindex="0"], [role="columnheader"][tabindex="0"]');
    if (cell && cell !== active) cell.focus();
  }, [curRow, curCol]);

  const onGridKeyDown = (e) => {
    const t = e.target;
    if (!t || typeof t.getAttribute !== 'function') return;
    const role = t.getAttribute('role');
    /* A control the consumer drew inside a cell is NOT a cell, and its keys are
       its own. Arena reads the role rather than the tag so a consumer's cell
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
      /* Enter activates the row by calling the ROW ELEMENT's own `onClick` --
         the contract's `click` event, bound as React spells it. There is no
         step-in to add: Calendar needed one because it had silenced its event
         blocks with tabIndex={-1}; Table silences nothing, so a consumer's cell
         button stays Tab-reachable and no capability is lost. Row 0 is the
         header and activates nothing. */
      e.preventDefault();
      const rowEl = curRow > 0 ? rowEls[curRow - 1] : null;
      if (rowEl && React.isValidElement(rowEl) && rowEl.props.onClick) rowEl.props.onClick();
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

  /* A cell reached by pointer takes the cursor with it; the bail-out is the
     same as the key handler's, because the effect above focuses the cursor cell
     and its focus event would otherwise re-render the grid a second time per
     move. The `e.target !== e.currentTarget` half of the guard lives in
     TableCell, on the element that owns the event. */
  const onCellFocus = (ri, ci) => {
    if (ri !== curRow || ci !== curCol) setCursor({ row: ri, col: ci });
  };

  const headerNav = (ci) => ({
    tabIndex: 0 === curRow && ci === curCol ? 0 : -1,
    onFocus: (e) => { if (e.target === e.currentTarget) onCellFocus(0, ci); },
  });
  /* The ring is an INSET box-shadow: a border would grow the content box, and an
     outward ring would be clipped by the wrapper's overflow:hidden. Returned as a
     style OBJECT to spread rather than as a bare value, so `boxShadow:` is never
     followed by a call whose arguments are numbers -- check:dimensions' PROP_COLON
     scanner reads the first number after a governed property and would report the
     row index as a bare literal. */
  const cellRing = (ri, ci) => ({
    outline: 'none',
    boxShadow: ri === curRow && ci === curCol && gridFocused
      ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined,
  });

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          {rowEls.length === 0 && (
            <div style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
              borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)', textAlign: 'center',
              color: 'var(--mute)', fontSize: 'var(--dz-text)' }}>{empty}</div>
          )}
          {rowEls.map((row, ri) => (React.isValidElement(row)
            ? React.cloneElement(row, { rowIndex: ri + 1, columns, layout: 'card' })
            : row))}
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
                  <th key={ci} role="columnheader" {...headerNav(ci)}
                    style={{ ...CELL_BASE, ...HEADER_LABEL, textAlign: c.align || 'left',
                      width: c.width, borderBottom: 'var(--bw) solid var(--color-base-300)',
                      ...cellRing(0, ci) }}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowEls.length === 0 && (
                <tr role="row"><td role="gridcell" colSpan={columns.length}
                  tabIndex={curRow === 1 && curCol === 0 ? 0 : -1}
                  onFocus={(e) => { if (e.target === e.currentTarget) onCellFocus(1, 0); }}
                  style={{ ...CELL_BASE, textAlign: 'center', color: 'var(--mute)',
                    padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)',
                    ...cellRing(1, 0) }}>{empty}</td></tr>
              )}
              {rowEls.map((row, ri) => (React.isValidElement(row)
                ? React.cloneElement(row, {
                  rowIndex: ri + 1,
                  columns,
                  layout: 'table',
                  cursorCol: curRow === ri + 1 ? curCol : null,
                  gridFocused,
                  onCellFocus,
                })
                : row))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
