import * as React from 'react';

/** One cell of a `TableRow`.
 *
 *  Its column config, whether the table is drawing rows or cards, and its place
 *  in the grid's keyboard order are injected by `TableRow` (fed by `Table`) and
 *  are deliberately absent from this interface, exactly as `RadioProps` omits
 *  the `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface TableCellProps {
  /** What the cell shows: a value, or one of Arena's own components — a `Badge`
   *  for a status, a `Button` for an action. @startingPoint the value itself.
   *
   *  This member is the reason `Table` is a compound component. `TableColumn`
   *  once carried a `render` function Arena called per cell, which is per-item
   *  projection and forbidden; a cell the consumer instantiates is one element
   *  they wrote, so the badge and the button stay reachable with no new form in
   *  the API vocabulary. */
  children?: React.ReactNode;
}

export function TableCell(props: TableCellProps): JSX.Element;
