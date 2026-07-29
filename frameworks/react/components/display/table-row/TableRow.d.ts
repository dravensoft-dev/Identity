import * as React from 'react';

export interface TableRowProps {

  children?: React.ReactNode;

  disabled?: boolean;

  onClick?: () => void;
}

export function TableRow(props: TableRowProps): JSX.Element;
