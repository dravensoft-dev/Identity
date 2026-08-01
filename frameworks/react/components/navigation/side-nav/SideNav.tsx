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

  /** An item was activated, carrying its id. It carried the whole SideNavItem for one batch, on the Breadcrumbs precedent that the platform event leaves the payload and the item alone travels; under the compound shape there is no item datum left to carry, because the consumer wrote the element and already holds everything on it. The native MouseEvent is still not forwarded, so a listener cannot call preventDefault() on the anchor's own navigation -- ctrl-click, middle-click and open-in-new-tab keep working for a consumer who wires nothing, and intercepting a plain click to substitute SPA routing belongs at the router. */
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
