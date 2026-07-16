import * as React from 'react';
/** Breadcrumb navigation (H3). Return path in deep hierarchies; the last item is the current location. */
export interface Crumb { label: string; href?: string; onClick?: (e: React.MouseEvent) => void; }
export interface BreadcrumbsProps {
  items: Crumb[];
  separator?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
