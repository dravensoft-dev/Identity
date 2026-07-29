/** One destination in a `SideNav`. Write one per destination.
 *
 *  Everything about WHERE the item sits — its nesting depth, which id is active,
 *  the indent step and the handler that reports `nav` — is injected by `SideNav`
 *  and is deliberately absent from this interface, exactly as `RadioProps` omits
 *  the `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface SideNavItemProps {
  /** Identifies the destination. `SideNav.active` names one of these. Required,
   *  and guarded at runtime against a blank value as well as an absent one. */
  id: string;
  /** What the item reads, and its whole accessible name. Required and guarded. */
  label: string;
  /** A Phosphor class name drawn before the label — Arena draws the `<i>`, the
   *  consumer names the glyph. */
  icon?: string;
  /** Present ⇒ an `<a>`; absent ⇒ a `<button>`. A control that navigates must be
   *  a link — openable in a new tab, address copyable, announced as a link. */
  href?: string;
}

export function SideNavItem(props: SideNavItemProps): JSX.Element;
