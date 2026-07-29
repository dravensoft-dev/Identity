import React, { useId } from 'react';
import { injectInto, indentFor, COLUMN } from '../side-nav/SideNavInject.jsx';

/** A named group of navigation items. It WRAPS -- it never replaces what a
 *  consumer wrote -- and its accessible name is the same heading a sighted user
 *  reads, so the grouping the eye sees is the grouping a screen reader announces.
 *
 *  A SECTION ALWAYS HAS CHILDREN, and that is a guard rather than a convention:
 *  the render below is a role="group" whose aria-labelledby resolves to a heading
 *  NAMING that group, so a childless one draws a label for nothing. That is the
 *  defect the guard refuses, and it is the load-bearing reason.
 *
 *  NO NAME LIST AND NO ORDINAL HERE, deliberately, because this clause once
 *  carried both and both went false. It used to justify the guard by "two shapes
 *  a single behaviour binding cannot describe", cite sibling components as
 *  carrying the same "true in one variant, false in the other" limit, and add
 *  that the limit "has no fix" -- and 8C9 built `cases` as exactly that fix,
 *  after which the cited components began leaving the limit one batch at a time.
 *  A component name written into another file's prose is a claim no gate reads,
 *  and so is an ordinal: this comment also shipped saying "the fifth instance"
 *  while its own batch-mate said "the fourth". CLAUDE.md's Known debt carries the
 *  record, the live commands, and the conditionality levels `cases` still does
 *  not reach. What survives of the secondary argument is only that a second shape
 *  would be a second thing to declare and verify, which is a cost rather than an
 *  impossibility. What IS optional is having sections at all: loose items at the
 *  root are legal and may sit beside them.
 *
 *  useId rather than a derived id: the section declares no `id` member, and this
 *  wiring is internal -- nothing outside needs to address the heading. That is the
 *  Dialog/ConfirmDialog precedent (never Math.random(), which differs between the
 *  server pass and the client one). SideNavCollapsible does the opposite for the
 *  opposite reason; see its own comment. */
export function SideNavSection({
  label, children,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  /* Falsy rather than absence-only, the same operator decision SideNav's,
   * SideNavItem's and SideNavCollapsible's guards carry: `label` is the whole
   * accessible name of the group this component renders, so `label=""` leaves a
   * role="group" whose aria-labelledby resolves to an empty heading -- the defect
   * the guard exists to prevent, arriving through a value that is present, which
   * `== null` would let through. */
  if (!label) throw new Error('SideNavSection: `label` is required');
  /* toArray().length, never Children.count(): count() counts a bare `false` as one
   * child, and the conditional-render idiom -- {isAdmin && <SideNavItem …/>} --
   * writes exactly that when the condition is false. The render path below goes
   * through injectInto, which is toArray() under the hood (see SideNavInject.jsx),
   * so a guard using count() would pass with "one child" while the actual render
   * drops it and produces the very childless group this guard exists to refuse --
   * the guard and the thing it guards would count two different things. Every other
   * child-count site in this layer already uses toArray().length for this reason:
   * Table.jsx, TableRow.jsx, Calendar.jsx, and injectInto itself. */
  if (React.Children.toArray(children).length === 0) {
    throw new Error('SideNavSection: a section with no children is not a legal shape');
  }
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} style={COLUMN}>
      <div id={labelId} style={{
        paddingInlineStart: indentFor(indentStep, depth),
        paddingBlock: 'calc(var(--sp-1) * 1.5)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-xs)',
        letterSpacing: 'var(--ls-badge)', textTransform: 'uppercase',
        color: 'var(--mute)',
      }}>{label}</div>
      {injectInto(children, { depth: depth + 1, activeId, indentStep, onActivate })}
    </div>
  );
}
