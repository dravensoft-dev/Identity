import * as React from 'react';
export interface SideNavItem {
  id: string;
  /** A node, not a name. The library ships no Icon component, and a SideNav
   *  that took strings would couple it to one it does not have. */
  icon?: React.ReactNode;
  label: React.ReactNode;
  /** Present ⇒ the item renders an `<a>`; absent ⇒ a `<button>`. A control that
   *  navigates must be a link — openable in a new tab, address copyable,
   *  announced as a link. An item that only changes local state is a button. */
  href?: string;
}
/** The sidebar's navigation list — the list alone, not the frame around it.
 * @startingPoint section="Navigation" subtitle="Sidebar navigation list" viewport="700x460" */
export interface SideNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SideNavItem[];
  /** The `id` of the current destination. Marks it `aria-current="page"`. */
  active?: string;
  onNav?: (id: string) => void;
  /** Names the landmark. Required in practice — a page with two navs whose
   *  labels are both "Primary" has two indistinguishable landmarks. */
  ariaLabel?: string;
  style?: React.CSSProperties;
}
export function SideNav(props: SideNavProps): JSX.Element;
