import * as React from 'react';

/** One row of a `Table`. Write one per row, with one `<TableCell>` inside it per
 *  cell.
 *
 *  Everything about WHERE the row sits — its index in the grid, the columns its
 *  cells are set against, which cell holds the roving tab stop, whether the
 *  table is drawing rows or cards — is injected by `Table` and is deliberately
 *  absent from this interface, exactly as `RadioProps` omits the
 *  `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface TableRowProps {
  /** The row's cells. @startingPoint one `<TableCell>` per column, in order. A
   *  row may carry fewer or more than there are columns; the grid's cursor is
   *  clamped against what is really there rather than against `columns.length`. */
  children?: React.ReactNode;
  /** The row was activated, by pointer or by Enter on one of its cells. No
   *  payload: you wrote this element, so you already hold the row this is about. */
  onClick?: () => void;
}

export function TableRow(props: TableRowProps): JSX.Element;
