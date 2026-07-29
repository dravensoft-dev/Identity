/** Page selector for a paged list. Renders a windowed range, never every page. */
export interface PaginationProps {
  /** @startingPoint The current page, 1-based. */
  page: number;
  /** How many pages there are. Required, and guarded at runtime: a Pagination
   *  with no page count renders a window over nothing. */
  pageCount: number;
  /** Names this navigation landmark. Two paginated tables in one dashboard is a
   *  routine layout, and both carry the identical name unless each is given its
   *  own. Say what is being paged — "Deployments", not "Pages". */
  ariaLabel?: string;
  /** A page was chosen; carries the new 1-based page. Never fires for the
   *  current page, nor for a page outside 1..pageCount. */
  onChange?: (page: number) => void;
}
export function Pagination(props: PaginationProps): JSX.Element;
