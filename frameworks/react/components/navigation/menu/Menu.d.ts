import * as React from 'react';
import type { MenuItem, MenuAlign } from '../../api.generated';

/* The pre-migration file declared and exported the item type locally, under the
 * name `MenuItemDef`, so it keeps a re-export — of the contract's name. There is
 * no `MenuItemDef` alias: this repo ships a breaking change outright rather than
 * a deprecation window, and the type is not the shape it used to be anyway —
 * `onClick` is gone (it is the component's `select` event now) and `icon` is a
 * Phosphor class-name string rather than a node. */
export type { MenuItem };

/** Dropdown menu of actions on a trigger — overflow, more actions, context. */
export interface MenuProps {
  /** The element that opens the menu. The consumer draws it — an IconButton with
   *  ph-dots-three-vertical, a secondary Button — so it is a slot, and it carries
   *  its own accessible name. */
  trigger: React.ReactNode;
  /** @startingPoint The entries, in order: activatable rows, dividers and group headers. */
  items: MenuItem[];
  /** Which edge of the trigger the panel lines up with. */
  align?: MenuAlign;
  /** An entry was activated; carries the whole item. A disabled entry reports
   *  nothing, and a divider or a header cannot be activated at all. */
  onSelect?: (item: MenuItem) => void;
}
export function Menu(props: MenuProps): JSX.Element;
