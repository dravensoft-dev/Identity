import * as React from 'react';

/** A named group of navigation items inside a `SideNav`. Write one per group, with
 *  one `<SideNavItem>` (or a nested `<SideNavSection>`/`<SideNavCollapsible>`)
 *  inside it per member.
 *
 *  Everything about WHERE the section sits -- its nesting depth, which id is
 *  active, the indent step and the handler that reports `nav` -- is injected by
 *  `SideNav` (or by the section or collapsible it is nested inside) and is
 *  deliberately absent from this interface, exactly as `RadioProps` omits the
 *  `name`/`checked`/`onSelect` `RadioGroup` injects.
 * @startingPoint section="Navigation" subtitle="Sidebar navigation list" viewport="700x460" */
export interface SideNavSectionProps {
  /** Names the group, both on screen and to assistive technology. Required, and
   *  guarded at runtime against a blank value as well as an absent one. */
  label: string;
  /** The items in the group. @startingPoint one `<SideNavItem>` per destination,
   *  or a nested `<SideNavSection>`/`<SideNavCollapsible>`, written as siblings or
   *  in an array -- never wrapped in a fragment or in a component of your own,
   *  which `React.Children.toArray` cannot see through. A section with no
   *  children is not a legal shape and throws -- which is why this is required
   *  rather than optional, the `AppLogo.mark` shape. */
  children: React.ReactNode;
}

export function SideNavSection(props: SideNavSectionProps): JSX.Element;
