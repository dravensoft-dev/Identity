import React from 'react';
import type { TableColumn } from '../../../Api.generated';
export type { TableColumn };
export interface TableProps {
    label: string;
    columns: TableColumn[];
    children?: React.ReactNode;
    empty?: React.ReactNode;
    responsive?: boolean;
}
export declare function Table({ columns, children, empty, responsive, label }: TableProps): React.JSX.Element;
