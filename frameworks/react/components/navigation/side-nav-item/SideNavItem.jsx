import React from 'react';
import { rowStyle, rowGlyph } from '../side-nav/SideNavInject.jsx';

/** One destination in a SideNav. `href` decides which element it renders, so it
 *  is the field to read first: present => an <a>, absent => a <button>.
 *
 *  Everything about WHERE the item sits -- its nesting depth, which id is active,
 *  the indent step, the handler that reports `nav` -- is injected by SideNav (or
 *  by the section or collapsible it sits inside) and is deliberately absent from
 *  this component's contract, exactly as RadioProps omits what RadioGroup gives
 *  each Radio. */
export function SideNavItem({
  id, label, icon, href,
  depth = 0, activeId, indentStep = 3, onActivate,
}) {
  /* Both guards are falsy rather than absence-only, and that is the operator
   * decision plan 8C4's close-out review paid for: `label` is this link's whole
   * accessible name and `id` is what `active` matches, so a present-but-blank
   * value IS the defect and `== null` would let it through. `SideNav.items`'
   * `== null` guard was the opposite case -- an empty array is a caller saying
   * "no destinations right now" -- and it left with the member. */
  if (!id) throw new Error('SideNavItem: `id` is required');
  if (!label) throw new Error('SideNavItem: `label` is required');
  const on = id === activeId;
  /* One style object for both elements: an anchor and a button must be
   * indistinguishable here, and two copies of this would drift. `rowStyle` is why
   * that now holds ACROSS components too -- a collapsible's trigger sits in the
   * same list and draws the same row, and it reads the same figure from
   * side-nav-inject.jsx rather than a second copy of it. The active-state ink
   * below stays here: it is this component's decision, not shared geometry. The
   * padding is split into block/inline rather than the old shorthand because the
   * inline start is where the indent lands. */
  const shared = {
    'aria-current': on ? 'page' : undefined,
    onClick: () => onActivate && onActivate(id),
    style: rowStyle({
      indentStep, depth,
      background: on ? 'var(--crimson-soft)' : 'transparent',
      color: on ? 'var(--crimson)' : 'var(--mute)',
      /* An <a> and a <button> must be indistinguishable, and only one of them
         underlines itself. The trigger passes nothing here for the same reason. */
      textDecoration: 'none',
      fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
    }),
  };
  /* Arena draws the glyph and the consumer names it -- the single-icon
   * convention, unchanged by this migration. */
  const glyph = rowGlyph(icon);
  return href
    ? <a href={href} {...shared}>{glyph}{label}</a>
    : <button type="button" {...shared}>{glyph}{label}</button>;
}
