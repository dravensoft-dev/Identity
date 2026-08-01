import React from 'react';
import type { TableColumn } from '../../../Api.generated';
export interface TableRowInjected {
    rowIndex: number;
    columns: TableColumn[];
    layout: 'table' | 'card';
    cursorCol: number | null;
    gridFocused: boolean;
    onCellFocus: (row: number, col: number) => void;
}
export interface TableRowProps {
    children?: React.ReactNode;
    interactive?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}
export declare function TableRow({ children, onClick, interactive, disabled, rowIndex, columns, layout, cursorCol, gridFocused, onCellFocus, }: TableRowProps & Partial<TableRowInjected>): React.JSX.Element;
