import React from 'react';
import type { TableColumn } from '../../../Api.generated';
import { tv } from '../../../Tv.generated.ts';
import manifest from '../table/Table.manifest.generated.ts';

const cellStyles = tv(manifest);

export interface TableCellProps {

  /** What the cell shows: a value, or one of Arena's own components, such as a Badge for a status or a Button for an action. This is what the compound shape exists for. The consumer instantiates one element per cell, so nothing here is per-item projection. */
  children?: React.ReactNode;
}

export interface TableCellInjected {
  column: TableColumn;
  layout: 'table' | 'card';
  tabIndex: number | undefined;
  focused: boolean;
  onCellFocus: (() => void) | undefined;
}



export function TableCell({
  children, column, layout = 'table', tabIndex, focused = false, onCellFocus,
}: TableCellProps & Partial<TableCellInjected>) {

  const c: Partial<TableColumn> = column ?? {};

  if (layout === 'card') {
    if (c.mobileLayout === 'block') {

      return (
        <div className={cellStyles({ narrow: true }).cardBlock()}>
          {children}
        </div>
      );
    }
    const card = cellStyles({ narrow: true });
    return (
      <div className={card.cardRow()}>
        <span className={card.cardLabel()}>{c.header}</span>
        <span className={c.mono ? card.cardValueMono() : card.cardValue()}>
          {children}
        </span>
      </div>
    );
  }

  return (
    <td role="gridcell" tabIndex={tabIndex}

      onFocus={onCellFocus ? (e) => { if (e.target === e.currentTarget) onCellFocus(); } : undefined}
      className={c.mono
        ? cellStyles({ narrow: false, align: c.align || 'left' }).tdMono()
        : cellStyles({ narrow: false, align: c.align || 'left' }).td()}
      style={{ boxShadow: focused ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined }}>
      {children}
    </td>
  );
}
