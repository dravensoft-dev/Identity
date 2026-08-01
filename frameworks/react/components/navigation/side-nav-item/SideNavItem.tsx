import React from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.tsx';
import { rowStyle, rowGlyph } from '../side-nav/SideNavInject.tsx';

export interface SideNavItemProps {

  id: string;

  label: string;

  icon?: string;

  href?: string;

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
