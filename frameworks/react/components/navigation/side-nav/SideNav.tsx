import React from 'react';
import { injectInto, COLUMN } from './SideNavInject.tsx';

export interface SideNavProps {

  /** The navigation tree. One SideNavItem per destination, optionally grouped by SideNavSection and SideNavCollapsible; where each child sits, which id is active and how it reports `nav` are the parent's to settle, and none of it is a member here. */
  children?: React.ReactNode;

  /** The id of the current destination. The SideNavItem whose id matches is marked aria-current="page", and no item is marked when it names none of them. */
  active?: string;

  /** Names this navigation landmark. Required, and guarded at runtime: the guard trims before it decides, so a blank name is refused as well as an absent one, because ariaLabel="" renders a landmark with no accessible name, which is the defect arriving through a value that is present. Guarded rather than defaulted: the navigation pattern asks each landmark on a page for a UNIQUE name, and a constant default satisfies the existence half while two sidebars on one page stay indistinguishable. Nothing can derive it either; what a nav is FOR is editorial. Say what it navigates -- "Primary", "Project settings" -- the Table.label and SegmentedControl.ariaLabel shape. */
  ariaLabel: string;

  /** How far each nesting level indents, as a MULTIPLIER of --sp-1 rather than a length: the row at depth N is padded calc(var(--sp-1) * 3 + var(--sp-1) * indentStep * N). A CSS string was rejected -- a caller-supplied "1.5rem" is neither a token nor a derivation of one, so it would stop re-densifying inside .arena-compact, and no gate would catch it because check:dimensions scans source and not the values a caller passes in. */
  indentStep?: number;

  /** An item was activated, carrying its id. It carries the id alone, on the Breadcrumbs precedent that the platform event leaves the payload and the item travels by itself, and under the compound shape there is no item datum left to carry either, because the consumer wrote the element and already holds everything on it. Where the item has an href, Arena has already cancelled the anchor by the time this fires, so a listener routes and does not double-navigate; ctrl-click, middle-click and open-in-new-tab are the browser's and fire nothing, so a consumer who wires no listener still has a working column of real links. */
  onNav?: (id: string) => void;
}


export function SideNav({ children, active, ariaLabel, indentStep = 3, onNav }: SideNavProps) {

  if (!ariaLabel?.trim()) throw new Error('SideNav: `ariaLabel` is required');
  return (
    <nav aria-label={ariaLabel} style={COLUMN}>
      {injectInto(children, { depth: 0, activeId: active, indentStep, onActivate: onNav })}
    </nav>
  );
}
