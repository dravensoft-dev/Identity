import React from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { rowStyle, rowGlyph } from '../side-nav/SideNavInject.tsx';

export interface SideNavItemProps {

  /** Identifies the destination. SideNav.active names one of these, and the item whose id matches is the one marked aria-current="page". Required, and guarded with a falsy check rather than an absence check: a blank id can never match and is an omission wearing a value. */
  id: string;

  /** What the item reads, and its whole accessible name. Required and falsy-guarded for the same reason. */
  label: string;

  /** A Phosphor class name drawn before the label -- Arena draws the <i>, the consumer names the glyph. */
  icon?: string;

  /** Present => the item renders an <a>; absent => a <button>. A control that navigates must be a link -- openable in a new tab, address copyable, announced as a link. An item that only changes local state is a button. */
  href?: string;

  /** Whether the destination is drawn but cannot be reached -- one the consumer's rules lock, such as a feature the current plan does not include. It reflects through `aria-disabled` rather than the native attribute, and rather than by not rendering the item at all: an unavailable destination a user can see and hear announced as unavailable is what tells them it exists, which is the whole reason to draw it. The anchor keeps its `href` so the case split stays what it is -- what changes is that activation is refused and the state is announced. */
  disabled?: boolean;
}


export function SideNavItem({
  id, label, icon, href, disabled = false,
  depth = 0, activeId, indentStep = 3, onActivate,
}: SideNavItemProps & Partial<SideNavInjected>) {

  if (!id) throw new Error('SideNavItem: `id` is required');
  if (!label) throw new Error('SideNavItem: `label` is required');
  const on = id === activeId;

  const shared = {
    'aria-current': on ? 'page' as const : undefined,
    'aria-disabled': disabled ? 'true' as const : undefined,
    onClick: (e: React.MouseEvent) => {
      if (disabled) { e.preventDefault(); return; }
      if (onActivate) onActivate(id);
    },
    style: rowStyle({
      indentStep, depth,
      background: on ? 'var(--crimson-soft)' : 'transparent',
      color: on ? 'var(--crimson)' : 'var(--mute)',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',

      textDecoration: 'none',
      fontWeight: on ? 'var(--fw-semibold)' : 'var(--fw-medium)',
    }),
  };

  const glyph = rowGlyph(icon);
  return href
    ? <a href={href} {...shared}>{glyph}{label}</a>
    : <button type="button" {...shared}>{glyph}{label}</button>;
}
