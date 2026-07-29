export interface PaginationProps {

  page: number;

  pageCount: number;

  ariaLabel?: string;

  onChange?: (page: number) => void;
}
export function Pagination(props: PaginationProps): JSX.Element;
