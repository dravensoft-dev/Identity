import React, { useEffect, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.ts';
import { HEADER_LABEL, CELL_BASE } from '../table-cell/TableCell.tsx';

import { Pagination } from '../../navigation/pagination/Pagination.tsx';

import type { TableColumn, TablePage, TableSort } from '../../../Api.generated';

export type { TableColumn };

export interface TableProps {

  /** Names the grid for assistive technology. Required, and guarded at runtime: nothing can derive it — Calendar names its grid from the range it is showing, and a data table's subject is editorial. Say what the rows are, never "Table". */
  label: string;

  /** The columns, in order. A column heads and sets its cells; it never says what goes in them. */
  columns: TableColumn[];

  /** The rows. One TableRow per row. Where a row sits, the columns its cells are set against and how the keyboard reaches them are Table's to decide and no row's to declare; how that reaches a row is each layer's own idiom. */
  children?: React.ReactNode;

  /** What shows when no row is written. In that state NO grid is drawn at all, header row included: a column head over a "no results" sentence describes a table that is not there, and a role="grid" holding neither a header nor a row is a degenerate render, the same judgement Tabs makes when it draws no panel for a tab that does not exist. Every layer falls back to the string 'No data.' when nothing is given, each in its own idiom for a default. Unlike Table.label this one IS derivable: 'No data.' states what happened rather than what the component is, which is the distinction that makes a fallback useful here and useless there. A consumer with a better sentence, what to do next or why the list is empty, projects it. */
  empty?: React.ReactNode;

  /** Card mode below --bp-md. Set false only when the columns are meaningless apart. */
  responsive?: boolean;

  /** Which column the rows are ordered by and which way. Controlled: Table draws the caret and the aria-sort, and the consumer does the ordering, because Table does not hold the rows. Absent, no header is a sort target. */
  sort?: TableSort;

  /** A sortable header was activated, carrying the column and the direction it should become: the same column flips, a different one starts ascending. Table never reorders anything itself, so a consumer who ignores this event gets a caret that moves and rows that do not, which is why the member is controlled rather than a starting value. */
  onSortChange?: (sort: TableSort) => void;

  /** Which page of a longer list is on screen. Present, Table draws its own Pagination below the grid and names it from `label`, which is what gives that required name its uniqueness on a page with two paged tables. Absent, no pager is drawn and the projected rows are the whole list. */
  page?: TablePage;

  /** A page was chosen, carrying the new 1-based page. It also fires with 1 when the total row count drops far enough that the current page is past the end, which is the reset a consumer otherwise writes by hand beside every filter; it fires only when the page has actually gone out of range, so a filter that leaves it valid is silent. */
  onPageChange?: (page: number) => void;
}


export function Table({
  columns, children, empty = 'No data.', responsive = true, label,
  sort, onSortChange, page, onPageChange,
}: TableProps) {
  if (!label?.trim()) throw new Error('Table: `label` is required');
  if (columns == null) throw new Error('Table: `columns` is required');
  const [ref, width] = useContainerWidth();

  const narrow = responsive && width !== null && width < readBreakpoint('md');

  const rowEls = React.Children.toArray(children);
  const bare = rowEls.length === 0;

  const pageCount = page ? Math.max(1, Math.ceil(page.total / Math.max(1, page.size))) : 1;

  useEffect(() => {
    if (page && page.index > pageCount) onPageChange?.(1);
  }, [page?.index, pageCount]);

  const sortStateOf = (index: number): 'ascending' | 'descending' | 'none' | undefined => {
    if (!columns[index]?.sortable || !sort) return undefined;
    if (sort.column !== index) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  };

  const onHeaderActivate = (index: number) => {
    if (!columns[index]?.sortable || !sort || !onSortChange) return;
    onSortChange(sort.column === index
      ? { column: index, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
      : { column: index, direction: 'asc' });
  };

  const gridRef = useRef<HTMLTableElement | null>(null);
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });

  const cellCounts = rowEls.map((row) => (
    React.isValidElement(row) ? React.Children.toArray(row.props.children).length : 0
  ));
  const rowLens = bare ? [] : [columns.length, ...cellCounts];

  const curRow = Math.min(Math.max(cursor.row, 0), Math.max(rowLens.length - 1, 0));
  const curCol = Math.min(Math.max(cursor.col, 0), Math.max((rowLens[curRow] || 0) - 1, 0));

  useEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const active = g.ownerDocument.activeElement;
    if (!active || !g.contains(active)) return;

    const activeRole = active.getAttribute('role');
    if (activeRole !== 'gridcell' && activeRole !== 'columnheader') return;
    const cell = g.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"], [role="columnheader"][tabindex="0"]');
    if (cell && cell !== active) cell.focus();
  }, [curRow, curCol]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const role = t.getAttribute('role');

    if (role !== 'gridcell' && role !== 'columnheader') return;

    let row = curRow;
    let col = curCol;
    if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
    else if (e.key === 'ArrowDown') row = Math.min(rowLens.length - 1, row + 1);
    else if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
    else if (e.key === 'ArrowRight') col = Math.min(Math.max((rowLens[row] || 1) - 1, 0), col + 1);

    else if (e.key === 'Home') col = 0;
    else if (e.key === 'End') col = Math.max((rowLens[row] || 1) - 1, 0);
    else if (e.key === 'Enter' || e.key === ' ') {

      e.preventDefault();
      if (curRow === 0) { onHeaderActivate(curCol); return; }
      if (e.key === ' ') return;
      const rowEl = rowEls[curRow - 1];
      if (rowEl && React.isValidElement<{ onClick?: () => void }>(rowEl) && rowEl.props.onClick) {
        rowEl.props.onClick();
      }
      return;
    } else return;

    col = Math.min(col, Math.max((rowLens[row] || 1) - 1, 0));

    e.preventDefault();

    if (row !== curRow || col !== curCol) setCursor({ row, col });
  };

  const onCellFocus = (ri: number, ci: number) => {
    if (ri !== curRow || ci !== curCol) setCursor({ row: ri, col: ci });
  };

  const headerNav = (ci: number) => ({
    tabIndex: 0 === curRow && ci === curCol ? 0 : -1,
    onFocus: (e: React.FocusEvent) => { if (e.target === e.currentTarget) onCellFocus(0, ci); },
  });

  const cellRing = (ri: number, ci: number): React.CSSProperties => ({
    outline: 'none',
    boxShadow: ri === curRow && ci === curCol && gridFocused
      ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined,
  });

  return (
    <div ref={ref} style={{ width: '100%' }}>
      {narrow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--sp-1) * 4)' }}>
          {bare && (
            <div style={{ background: 'var(--surface-card)', border: 'var(--bw) solid var(--color-base-300)',
              borderRadius: 'var(--r-lg)', padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)', textAlign: 'center',
              color: 'var(--mute)', fontSize: 'var(--dz-text)' }}>{empty}</div>
          )}
          {rowEls.map((row, ri) => (React.isValidElement(row)
            ? React.cloneElement(row, { rowIndex: ri + 1, columns, layout: 'card' })
            : row))}
        </div>
      ) : bare ? (
        <div style={{ border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)',
          background: 'var(--surface-card)', padding: 'calc(var(--sp-1) * 8) calc(var(--sp-1) * 4)',
          textAlign: 'center', color: 'var(--mute)', fontSize: 'var(--dz-text)' }}>{empty}</div>
      ) : (
        <div style={{ border: 'var(--bw) solid var(--color-base-300)', borderRadius: 'var(--r-lg)',
          overflow: 'hidden', background: 'var(--surface-card)' }}>
          {

}
          <table role="grid" aria-label={label} ref={gridRef}
            onKeyDown={onGridKeyDown}
            onFocus={() => setGridFocused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setGridFocused(false); }}
            style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr role="row" style={{ background: 'var(--color-base-300)' }}>
                {columns.map((c, ci) => (
                  <th key={ci} role="columnheader" {...headerNav(ci)}
                    aria-sort={sortStateOf(ci)}
                    onClick={c.sortable && sort ? () => onHeaderActivate(ci) : undefined}
                    style={{ ...CELL_BASE, ...HEADER_LABEL, textAlign: c.align || 'left',
                      width: c.width, borderBottom: 'var(--bw) solid var(--color-base-300)',
                      cursor: c.sortable && sort ? 'pointer' : undefined,
                      userSelect: c.sortable && sort ? 'none' : undefined,
                      ...cellRing(0, ci) }}>{c.header}{sortStateOf(ci) && sortStateOf(ci) !== 'none' && (
                        <i aria-hidden="true"
                          className={sort?.direction === 'asc' ? 'ph-bold ph-caret-up' : 'ph-bold ph-caret-down'}
                          style={{ display: 'inline-flex', marginInlineStart: 'calc(var(--sp-1) * 1.5)',
                            verticalAlign: 'middle', fontSize: 'var(--icon-sm)' }} />
                      )}</th>
                ))}
              </tr>
            </thead>
            <tbody>
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
      {!bare && page && (
        <div style={{ display: 'flex', justifyContent: 'flex-end',
          borderTop: 'var(--bw) solid var(--color-base-300)',
          padding: 'var(--dz-row-py) var(--dz-row-px)' }}>
          <Pagination page={page.index} pageCount={pageCount} ariaLabel={label}
            onChange={(next) => onPageChange?.(next)} />
        </div>
      )}
    </div>
  );
}
