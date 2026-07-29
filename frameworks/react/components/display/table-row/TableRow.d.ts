import * as React from 'react';

export interface TableRowProps {

  children?: React.ReactNode;

  onClick?: () => void;
}

export function TableRow(props: TableRowProps): JSX.Element;
