import React from 'react';
export interface PaginationProps {
    page: number;
    pageCount: number;
    ariaLabel: string;
    onChange?: (page: number) => void;
}
export declare function Pagination({ page, pageCount, ariaLabel, onChange }: PaginationProps): React.JSX.Element;
