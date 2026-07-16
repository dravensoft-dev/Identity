import * as React from 'react';
export interface TableColumn<T = any> {
  key: string; header: string; align?: 'left' | 'center' | 'right';
  width?: number | string; mono?: boolean; render?: (value: any, row: T) => React.ReactNode;
}
/** Tabla de datos que respeta los tokens de densidad (--dz-*). */
export interface TableProps<T = any> {
  columns: TableColumn<T>[]; rows: T[]; getRowKey?: (row: T, i: number) => React.Key;
  onRowClick?: (row: T, i: number) => void; empty?: React.ReactNode; style?: React.CSSProperties;
}
export function Table<T = any>(props: TableProps<T>): JSX.Element;
