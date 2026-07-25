import type { SideNavItem } from '../../api.generated';

/* The pre-migration file declared and exported the item type locally, under this
 * same name, so it keeps a re-export. There is no alias for anything: this repo
 * ships a breaking change outright rather than a deprecation window, and the
 * type is not the shape it used to be anyway — `icon` and `label` are Phosphor
 * class-name and text strings now, not nodes. */
export type { SideNavItem };

/** The sidebar's navigation list — the list alone, not the frame around it.
 * @startingPoint section="Navigation" subtitle="Sidebar navigation list" viewport="700x460" */
export interface SideNavProps {
  /** The destinations, in order. Required, and guarded at runtime against
   *  ABSENCE only: an empty array is a caller saying "no destinations right
   *  now" and renders an empty landmark, which is legal. */
  items: SideNavItem[];
  /** The `id` of the current destination. Marks it `aria-current="page"`, and
   *  no item is marked when it names none of them. */
  active?: string;
  /** Names the landmark. Required, and guarded rather than defaulted: the
   *  navigation pattern asks each landmark on a page for a unique name, and a
   *  constant default gives two navs the same one. Say what it navigates. */
  ariaLabel: string;
  /** An item was activated; carries that item alone. The click event is not
   *  forwarded, so the anchor's own navigation cannot be suppressed from here —
   *  ctrl-click, middle-click and open-in-new-tab keep working, and substituting
   *  SPA routing for a plain click belongs at the router. */
  onNav?: (item: SideNavItem) => void;
}
export function SideNav(props: SideNavProps): JSX.Element;
