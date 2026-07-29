import * as React from 'react';
import type { TableColumn } from '../../api.generated';

/* `TableColumn` was declared and exported locally by the pre-migration file, so
 * it keeps a re-export. It is no longer generic: `TableColumn<Deploy>` is a
 * breaking change for any consumer who wrote one, and there is none in-tree.
 * `key` and `render` are GONE from it — a column no longer reads a field of a
 * row object, because there is no row object, and it no longer draws a cell,
 * because the consumer writes one. */
export type { TableColumn };

/** Data table that respects the density tokens (--dz-*).
 *  Below --bp-md it renders one card per row — measured on its own container,
 *  not the viewport, so a table in a narrow panel goes card-mode there too. */
export interface TableProps {
  /**
   * Names the grid for assistive technology — `aria-label` on the `role="grid"`.
   * REQUIRED, and guarded at runtime. It cannot be derived: `Calendar` names its
   * grid from the date range it is showing, and a data table's subject is
   * editorial — only the caller knows what these rows are. A constant fallback
   * was rejected on purpose; an unnamed grid is worse than a generic one.
   */
  label: string;
  /** The columns, in order. A column heads and sets its cells — alignment, width,
   *  the mono/gold treatment, its card-mode layout — and never says what goes in
   *  them. */
  columns: TableColumn[];
  /** The rows. One `<TableRow>` per row, each holding one `<TableCell>` per cell.
   *  `Table` injects where each row sits, the columns its cells are set against
   *  and how the keyboard reaches them; write `key` on each row, which is React's
   *  own reconciliation and no member of any contract. */
  children?: React.ReactNode;
  /** What shows when no row is written. @startingPoint a sentence, not a component. */
  empty?: React.ReactNode;
  /** Card mode below --bp-md. Default true. Set false only when the columns
   *  are meaningless apart — a matrix you scroll rather than read row by row. */
  responsive?: boolean;
}

export function Table(props: TableProps): JSX.Element;
