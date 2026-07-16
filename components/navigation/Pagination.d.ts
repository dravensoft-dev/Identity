import * as React from 'react';
/** Navigation between pages of a large set. */
export interface PaginationProps {
  page: number; pageCount: number; onChange?: (page: number) => void; style?: React.CSSProperties;
}
export function Pagination(props: PaginationProps): JSX.Element;
