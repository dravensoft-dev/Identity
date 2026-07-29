import React from 'react';
import { injectInto, COLUMN } from './SideNavInject.jsx';

/** The sidebar's navigation list -- the list alone, not the frame around it.
 *  See the Non-goals in the source spec for why there is no AppShell.
 *
 *  A COMPOUND component. The consumer writes one <SideNavItem> per destination,
 *  optionally grouped by <SideNavSection> and <SideNavCollapsible>; SideNav walks
 *  its direct children and injects where each sits, which id is active and the
 *  handler that reports `nav`. None of what it injects is a member of any
 *  contract -- the Table/TableRow shape, one size down. */
export function SideNav({ children, active, ariaLabel, indentStep = 3, onNav }) {
  /* Falsy, not absence-only: `ariaLabel=""` renders <nav aria-label="">, a
   * landmark with NO accessible name -- exactly the defect the guard exists to
   * prevent, arriving through a value that is present. An accessible name is
   * guarded rather than defaulted because the constant default was itself the
   * defect: the navigation pattern asks each landmark on a page for a UNIQUE
   * name, two sidebars sharing one are indistinguishable, and nothing can derive
   * what a nav is for. */
  if (!ariaLabel) throw new Error('SideNav: `ariaLabel` is required');
  return (
    <nav aria-label={ariaLabel} style={COLUMN}>
      {injectInto(children, { depth: 0, activeId: active, indentStep, onActivate: onNav })}
    </nav>
  );
}
