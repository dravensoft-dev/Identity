import * as React from 'react';
import type { TableColumn } from '../../../Api.generated';

export type { TableColumn };

export interface TableProps {

  label: string;

  columns: TableColumn[];

  children?: React.ReactNode;

  empty?: React.ReactNode;

  responsive?: boolean;
}

export function Table(props: TableProps): JSX.Element;
