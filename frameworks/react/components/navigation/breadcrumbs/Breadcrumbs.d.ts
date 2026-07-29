import type { Crumb } from '../../../Api.generated';

export type { Crumb };
export interface BreadcrumbsProps {

  ariaLabel: string;

  items: Crumb[];

  separator?: string;

  onNavigate?: (crumb: Crumb) => void;
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
