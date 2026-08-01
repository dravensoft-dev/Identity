import React, { useEffect, useRef, useState } from 'react';
import { useContainerWidth, readBreakpoint } from '../../../UseContainerWidth.ts';
import { HEADER_LABEL, CELL_BASE } from '../table-cell/TableCell.tsx';

import type { TableColumn } from '../../../Api.generated';

export type { TableColumn };

export interface TableProps {

  label: string;

  columns: TableColumn[];

  children?: React.ReactNode;

  empty?: React.ReactNode;

  responsive?: boolean;
}


export function Table({ columns, children, empty = 'No data.', responsive = true, label }: TableProps) {
  if (!label?.trim()) throw new Error('Table: `label` is required');
  if (columns == null) throw new Error('Table: `columns` is required');
  const [ref, width] = useContainerWidth();

  const narrow = responsive && width !== null && width < readBreakpoint('md');

  const rowEls = React.Children.toArray(children);

  const gridRef = useRef<HTMLTableElement | null>(null);
  const [gridFocused, setGridFocused] = useState(false);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });

  const cellCounts = rowEls.map((row) => (
    React.isValidElement(row) ? React.Children.toArray(row.props.children).length : 0
  ));
  const rowLens = [columns.length, ...(rowEls.length === 0 ? [1] : cellCounts)];

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
    else if (e.key === 'Enter') {

      e.preventDefault();
      const rowEl = curRow > 0 ? rowEls[curRow - 1] : null;
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
