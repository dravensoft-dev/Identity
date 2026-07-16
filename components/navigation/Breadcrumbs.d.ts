import * as React from 'react';
/** Migas de navegación (H3). Ruta de retorno en jerarquías profundas; el último ítem es la ubicación actual. */
export interface Crumb { label: string; href?: string; onClick?: (e: React.MouseEvent) => void; }
export interface BreadcrumbsProps {
  items: Crumb[];
  separator?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
