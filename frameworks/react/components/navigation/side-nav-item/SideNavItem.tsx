import React from 'react';
import { isPrimaryActivation } from '../../../AnchorActivation.ts';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { indentFor } from '../side-nav/SideNavInject.tsx';
import { activeWeight, badgeCount } from '../NavRow.ts';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from '../side-nav/SideNav.classes.generated.ts';

export interface SideNavItemProps {

  /** Identifies the destination. SideNav.active names one of these, and the item whose id matches is the one marked aria-current="page". Required, and guarded with a falsy check rather than an absence check: a blank id can never match and is an omission wearing a value. */
  id: string;

  /** What the item reads, and the whole of its accessible name unless a badge adds a count to it. Required and falsy-guarded for the same reason. */
  label: string;

  /** A Phosphor class name drawn before the label -- Arena draws the <i>, the consumer names the glyph. **The ACTIVE row is drawn in the filled weight, and there is no member for it**: the item whose id matches SideNav.active swaps whatever weight the string carries for `ph-fill`, so a consumer passes one string per destination rather than two and a conditional. It is Arena's convention, so Arena applies it, the same judgement that inverted PageHead's guidance rather than adding a boolean whose false nobody wants. Pass `ph-fill` yourself and nothing changes, since the swap is idempotent. */
  icon?: string;

  /** A count drawn at the row's trailing edge -- pending orders, unread notices. Zero draws nothing, because a badge reading 0 is a mark that says there is nothing to mark; above 99 it reads "99+", so a four-digit count cannot widen the column. A number rather than a string, because the two rules above are arithmetic and a caller who has already formatted the value has taken them away. It is NOT hidden from assistive technology, so the row announces "Orders 12": a count a screen-reader user cannot hear is a count that is not there, and aria-hidden on it would trade a real loss for a tidier name. What the 12 counts stays unsaid, because nothing can derive it and no member states it -- say it in the label where it matters. */
  badge?: number;

  /** Present => the item renders an <a>; absent => a <button>. A control that navigates must be a link -- openable in a new tab, address copyable, announced as a link. An item that only changes local state is a button. A primary click with no modifier is cancelled and reported through SideNav's `nav`, so a router owns it; a modified or middle click is the browser's and reports nothing. */
  href?: string;

  /** Whether the destination is drawn but cannot be reached -- one the consumer's rules lock, such as a feature the current plan does not include. It reflects through `aria-disabled` rather than the native attribute, and rather than by not rendering the item at all: an unavailable destination a user can see and hear announced as unavailable is what tells them it exists, which is the whole reason to draw it. The anchor keeps its `href` so the case split stays what it is -- what changes is that activation is refused and the state is announced. */
  disabled?: boolean;
}


const sideNavStyles = arenaStyles(manifest);

export function SideNavItem({
  id, label, icon, badge, href, disabled = false,
  depth = 0, activeId, indentStep = 3, onActivate,
}: SideNavItemProps & Partial<SideNavInjected>) {

  if (!id) throw new Error('SideNavItem: `id` is required');
  if (!label) throw new Error('SideNavItem: `label` is required');
  const on = id === activeId;
  const styles = sideNavStyles({ active: on });

  const shared = {
    'aria-current': on ? 'page' as const : undefined,
    'aria-disabled': disabled ? 'true' as const : undefined,
    onClick: (e: React.MouseEvent) => {
      if (disabled) { e.preventDefault(); return; }
      if (href !== undefined) {
        if (!isPrimaryActivation(e)) return;
        e.preventDefault();
      }
      if (onActivate) onActivate(id);
    },
    className: styles.item(),
    style: { paddingInlineStart: indentFor(indentStep, depth) },
  };

  const glyph = icon
    ? <i className={`${on ? activeWeight(icon) : icon} ${styles.icon()}`} aria-hidden="true" />
    : null;
  const count = badgeCount(badge);
  const tally = count === null ? null : <span className={styles.badge()}>{count}</span>;
  return href
    ? <a href={href} {...shared}>{glyph}{label}{tally}</a>
    : <button type="button" {...shared}>{glyph}{label}{tally}</button>;
}
