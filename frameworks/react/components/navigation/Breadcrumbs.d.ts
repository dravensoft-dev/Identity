import type { Crumb } from '../../api.generated';
/** Breadcrumb navigation (H3). Return path in deep hierarchies; the last item is the current location. */
export type { Crumb };
export interface BreadcrumbsProps {
  /** The trail, root first. The last entry is the current location. */
  items: Crumb[];
  /** Drawn between crumbs, never before the first. */
  separator?: string;
  /** A non-current crumb was activated. The anchor's own navigation still
   *  fires -- ctrl-click, middle-click and open-in-new-tab keep working. */
  onNavigate?: (crumb: Crumb) => void;
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;
