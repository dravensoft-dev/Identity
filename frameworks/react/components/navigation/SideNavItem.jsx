import React from 'react';
import { indentFor } from './side-nav-inject.jsx';

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
   * indistinguishable here, and two copies of this would drift. The padding is
   * split into block/inline rather than the old shorthand because the inline
   * start is where the indent lands. */
  const shared = {
    'aria-current': on ? 'page' : undefined,
    onClick: () => onActivate && onActivate(id),
    style: {
      display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
      paddingBlock: 'calc(var(--sp-1) * 2.5)',
      paddingInlineEnd: 'calc(var(--sp-1) * 3)',
      paddingInlineStart: indentFor(indentStep, depth),
      borderRadius: 'var(--r-sm)',
      background: on ? 'var(--crimson-soft)' : 'transparent',
      color: on ? 'var(--crimson)' : 'var(--mute)',
      border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
      fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)',
      fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
    },
  };
  /* Arena draws the glyph and the consumer names it -- the single-icon
   * convention, unchanged by this migration. */
  const glyph = icon
    ? <i className={icon} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;
  return href
    ? <a href={href} {...shared}>{glyph}{label}</a>
    : <button type="button" {...shared}>{glyph}{label}</button>;
}
