import React from 'react';
import type { TableColumn } from '../../../Api.generated';
export interface TableCellProps {
    children?: React.ReactNode;
}
export interface TableCellInjected {
    column: TableColumn;
    layout: 'table' | 'card';
    tabIndex: number | undefined;
    focused: boolean;
    onCellFocus: (() => void) | undefined;
}
export declare const HEADER_LABEL: React.CSSProperties;
export declare const CELL_BASE: React.CSSProperties;
export declare const valueStyle: (column: Pick<TableColumn, "mono">) => React.CSSProperties;
export declare function TableCell({ children, column, layout, tabIndex, focused, onCellFocus, }: TableCellProps & Partial<TableCellInjected>): React.JSX.Element;
