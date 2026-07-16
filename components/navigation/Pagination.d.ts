import * as React from 'react';
/** Navegación entre páginas de un conjunto grande. */
export interface PaginationProps {
  page: number; pageCount: number; onChange?: (page: number) => void; style?: React.CSSProperties;
}
export function Pagination(props: PaginationProps): JSX.Element;
