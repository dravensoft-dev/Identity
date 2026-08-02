import React from 'react';
import type { TableColumn } from '../../../Api.generated';

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


export const HEADER_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)', letterSpacing: 'var(--ls-column-header)',
  textTransform: 'uppercase', color: 'var(--mute)', fontWeight: 'var(--fw-bold)',
};

export const CELL_BASE: React.CSSProperties = {
  padding: 'var(--dz-row-py) var(--dz-row-px)', fontSize: 'var(--dz-text)',
  textAlign: 'left', verticalAlign: 'middle',
};

export const valueStyle = (column: Pick<TableColumn, 'mono'>): React.CSSProperties => ({
  fontFamily: column.mono ? 'var(--font-mono)' : 'var(--font-body)',
  fontVariantNumeric: column.mono ? 'tabular-nums' : undefined,
  color: column.mono ? 'var(--gold)' : 'var(--bone-dim)',
});

export function TableCell({
  children, column, layout = 'table', tabIndex, focused = false, onCellFocus,
}: TableCellProps & Partial<TableCellInjected>) {

  const c: Partial<TableColumn> = column ?? {};

  if (layout === 'card') {
    if (c.mobileLayout === 'block') {

      return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end',
          gap: 'calc(var(--sp-1) * 2)', borderTop: 'var(--bw) solid var(--color-base-300)',
          paddingTop: 'calc(var(--sp-1) * 2)' }}>
          {children}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'calc(var(--sp-1) * 3)' }}>
        <span style={HEADER_LABEL}>{c.header}</span>
        <span style={{ ...valueStyle(c), minWidth: 0, textAlign: 'right', fontSize: 'var(--dz-text)' }}>
          {children}
        </span>
      </div>
    );
  }

  return (
    <td role="gridcell" tabIndex={tabIndex}

      onFocus={onCellFocus ? (e) => { if (e.target === e.currentTarget) onCellFocus(); } : undefined}
      style={{ ...CELL_BASE, ...valueStyle(c), textAlign: c.align || 'left',

        outline: 'none',
        boxShadow: focused ? 'inset 0 0 0 var(--focus-width) var(--focus-ring)' : undefined }}>
      {children}
    </td>
  );
}
