import * as React from 'react';
export interface TableColumn<T = any> {
  key: string; header: string; align?: 'left' | 'center' | 'right';
  width?: number | string; mono?: boolean; render?: (value: any, row: T) => React.ReactNode;
  /**
   * How this column renders in card mode (below --bp-md).
   * 'row' (default) — a label/value pair, header left, value right.
   * @startingPoint 'block' — full width with no label, for the actions column.
   */
  mobileLayout?: 'row' | 'block';
}
/** Data table that respects the density tokens (--dz-*).
 *  Below --bp-md it renders one card per row — measured on its own container,
 *  not the viewport, so a table in a narrow panel goes card-mode there too. */
export interface TableProps<T = any> {
  columns: TableColumn<T>[]; rows: T[]; getRowKey?: (row: T, i: number) => React.Key;
  onRowClick?: (row: T, i: number) => void; empty?: React.ReactNode;
  /** Card mode below --bp-md. Default true. Set false only when the columns
   *  are meaningless apart — a matrix you scroll rather than read row by row. */
  responsive?: boolean;
  style?: React.CSSProperties;
}
export function Table<T = any>(props: TableProps<T>): JSX.Element;
