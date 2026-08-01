import React from 'react';
import type { Crumb } from '../../../Api.generated';
export type { Crumb };
export interface BreadcrumbsProps {
    ariaLabel: string;
    items: Crumb[];
    separator?: string;
    onNavigate?: (crumb: Crumb) => void;
}
export declare function Breadcrumbs({ items, ariaLabel, separator, onNavigate }: BreadcrumbsProps): React.JSX.Element;
