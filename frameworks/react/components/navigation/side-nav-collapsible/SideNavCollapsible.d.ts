import * as React from 'react';

/** A named group inside a `SideNav` that shows and hides its own contents. Write
 *  one `<SideNavItem>` (or a nested `<SideNavSection>`/`<SideNavCollapsible>`)
 *  inside it per member.
 *
 *  It binds the `disclosure` pattern and is deliberately NOT a treeview: there is
 *  no `aria-level`, no roving tab stop and no arrow navigation, because each
 *  collapsible is an independent disclosure rather than a node in one widget.
 *
 *  Everything about WHERE the group sits -- its nesting depth, which id is
 *  active, the indent step and the handler that reports `nav` -- is injected by
 *  `SideNav` (or by the section or collapsible it is nested inside) and is
 *  deliberately absent from this interface, exactly as `RadioProps` omits the
 *  `name`/`checked`/`onSelect` `RadioGroup` injects. */
export interface SideNavCollapsibleProps {
  /** Identifies the group. The disclosure wiring needs two ids that resolve -- the
   *  trigger's `aria-controls` names the region, the region's `aria-labelledby`
   *  names the trigger -- and Arena derives both from this, as `${id}-trigger` and
   *  `${id}-region`. Neither wiring is conditional, so the id is required rather
   *  than optional; a group is a thing you name anyway. Guarded at runtime against
   *  a blank value as well as an absent one, because a blank one yields the shared
   *  pair `-trigger`/`-region`. Being able to address either element from outside
   *  -- an `aria-describedby`, a deep link, a test hook -- follows from the
   *  derivation rather than motivating it. */
  id: string;
  /** What the trigger reads, and the accessible name of both the trigger and the
   *  region it controls. Required and guarded. */
  label: string;
  /** A Phosphor class name drawn before the label -- Arena draws the `<i>`, the
   *  consumer names the glyph. The caret reporting expanded-ness is Arena's own
   *  and is not this member. */
  icon?: string;
  /** Whether the group starts open. A seed, not a control: after the first render
   *  the state is the component's, and the group also opens itself when it comes
   *  to hold the active destination. @default false */
  defaultExpanded?: boolean;
  /** What the group holds. @startingPoint one `<SideNavItem>` per destination, or
   *  a nested `<SideNavSection>`/`<SideNavCollapsible>`, written as siblings or in
   *  an array -- never wrapped in a fragment or in a component of your own, which
   *  `React.Children.toArray` cannot see through. Each is re-injected one nesting
   *  level deeper. */
  children?: React.ReactNode;
  /** The trigger was pressed; carries the state it moved to. It fires on a press
   *  ONLY -- the automatic expansion that follows the active destination is
   *  Arena's decision rather than the user's, and reporting it here would be a lie
   *  a consumer persists to a preference store. */
  onToggle?: (expanded: boolean) => void;
}

export function SideNavCollapsible(props: SideNavCollapsibleProps): JSX.Element;
