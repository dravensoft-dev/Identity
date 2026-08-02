import React from 'react';
import { activeWeight, badgeCount } from '../NavRow.ts';

export interface SideNavInjected {
  depth: number;
  indentStep: number;
  activeId?: string;
  onActivate?: (id: string) => void;
}

export function injectInto(children: React.ReactNode, injected: SideNavInjected): React.ReactNode[] {
  return React.Children.toArray(children).map((child) => (
    React.isValidElement<Partial<SideNavInjected>>(child) ? React.cloneElement(child, injected) : child
  ));
}

export function indentFor(indentStep: number, depth: number): string {
  const steps = indentStep * depth;
  return steps === 0
    ? 'calc(var(--sp-1) * 3)'
    : `calc(var(--sp-1) * 3 + var(--sp-1) * ${steps})`;
}

export const COLUMN: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' };

export interface RowStyleOptions {
  indentStep: number;
  depth: number;
  background?: string;
  color?: string;
  fontWeight?: string;
  textDecoration?: string;
  opacity?: number;
  cursor?: string;
}

export function rowStyle({
  indentStep, depth, background, color, fontWeight, textDecoration, opacity, cursor,
}: RowStyleOptions): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 'calc(var(--sp-1) * 3)',
    paddingBlock: 'calc(var(--sp-1) * 2.5)',
    paddingInlineEnd: 'calc(var(--sp-1) * 3)',
    paddingInlineStart: indentFor(indentStep, depth),
    borderRadius: 'var(--r-sm)',
    background, color,
    border: 'none', cursor: cursor ?? 'pointer', textAlign: 'left', textDecoration, opacity,
    fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text)',
    fontWeight,
  };
}

export function rowBadge(badge: number | undefined, active: boolean): React.ReactElement | null {
  const tally = badgeCount(badge);
  if (tally === null) return null;
  return (
    <span style={{
      marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 'calc(var(--sp-1) * 5)', paddingInline: 'calc(var(--sp-1) * 1.5)',
      borderRadius: 'var(--r-pill)',
      background: active ? 'var(--crimson)' : 'var(--bg-raised)',
      color: active ? 'var(--color-primary-content)' : 'var(--text-body)',
      fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)',
      fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-badge)',
    }}>{tally}</span>
  );
}

export function rowGlyph(icon: string | undefined, active = false): React.ReactElement | null {
  return icon
    ? <i className={active ? activeWeight(icon) : icon} aria-hidden="true"
        style={{ fontSize: 'var(--icon-lg)', display: 'inline-flex' }} />
    : null;
}
