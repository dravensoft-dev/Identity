import * as React from 'react';

/* NO RE-EXPORT. The pre-migration file re-exported the item TYPE under the name
 * `SideNavItem`, on api/README.md's back-compat rule that a migrated `.d.ts`
 * re-exports whatever the old one named. That rule is deliberately broken here,
 * and this is its one exception: `SideNavItem` is a COMPONENT in this directory
 * now, with its own contract and its own `.d.ts`, and one name cannot mean both
 * a component and a shape a consumer imports from here. The old import breaks
 * outright, which is this repo's convention — a breaking change ships whole
 * rather than behind a deprecation window. */

/** The sidebar's navigation list — the list alone, not the frame around it.
 *
 *  A COMPOUND component: write one `<SideNavItem>` per destination as a direct
 *  child. `SideNav` injects where each child sits, which id is active and the
 *  handler that reports `nav`; none of those injected props is a member of any
 *  contract.
 * @startingPoint section="Navigation" subtitle="Sidebar navigation list" viewport="700x460" */
export interface SideNavProps {
  /** The navigation tree. One `<SideNavItem>` per destination, written as
   *  siblings or in an array — never wrapped in a fragment or in a component of
   *  your own, which `React.Children.toArray` cannot see through. */
  children?: React.ReactNode;
  /** The `id` of the current destination. Marks that item `aria-current="page"`,
   *  and no item is marked when it names none of them. */
  active?: string;
  /** Names the landmark. Required, and guarded rather than defaulted: the
   *  navigation pattern asks each landmark on a page for a unique name, and a
   *  constant default gives two navs the same one. Say what it navigates. */
  ariaLabel: string;
  /** How far each nesting level indents, as a multiplier of `--sp-1` rather than
   *  a length: the row at depth N is padded
   *  `calc(var(--sp-1) * 3 + var(--sp-1) * indentStep * N)`. A CSS string is not
   *  accepted here -- a caller-supplied `"1.5rem"` is neither a token nor a
   *  derivation of one, so it would stop re-densifying inside `.arena-compact`.
   *  @default 3 */
  indentStep?: number;
  /** An item was activated; carries its `id` alone. There is no item datum to
   *  carry under the compound shape — you wrote the element, so you already hold
   *  everything on it. The click event is not forwarded either, so the anchor's
   *  own navigation cannot be suppressed from here — ctrl-click, middle-click and
   *  open-in-new-tab keep working, and substituting SPA routing for a plain click
   *  belongs at the router. */
  onNav?: (id: string) => void;
}
export function SideNav(props: SideNavProps): JSX.Element;
