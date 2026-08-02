import React from 'react';

export interface BottomNavInjected {
  activeId?: string;
  onActivate?: (id: string) => void;
}

export function injectInto(children: React.ReactNode, injected: BottomNavInjected): React.ReactNode[] {
  return React.Children.toArray(children).map((child) => (
    React.isValidElement<Partial<BottomNavInjected>>(child) ? React.cloneElement(child, injected) : child
  ));
}

export const BAR: React.CSSProperties = {
  position: 'fixed', insetInlineStart: 0, insetInlineEnd: 0, bottom: 0,
  zIndex: 'var(--z-nav)', display: 'flex', alignItems: 'stretch',
  height: 'var(--layout-bar)', paddingBottom: 'var(--pad-safe-bottom)',
  background: 'var(--surface-card)', borderTop: 'var(--bw) solid var(--line-strong)',
  boxSizing: 'content-box',
};

export function columnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', flex: '1 1 0', minWidth: 0, flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-1)',
    paddingInline: 'var(--sp-1)',
    background: 'none', border: 'none', textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    fontFamily: 'var(--font-body)', fontSize: 'var(--dz-text-2xs)', fontWeight: 'var(--fw-medium)',
    color: active ? 'var(--crimson)' : 'var(--mute)',
  };
}

export const LABEL: React.CSSProperties = {
  maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};

export const GLYPH: React.CSSProperties = {
  position: 'relative', display: 'inline-flex',
  fontSize: 'var(--icon-lg)', lineHeight: 'var(--dz-lh)',
};

export const BADGE: React.CSSProperties = {
  position: 'absolute', top: 'calc(var(--sp-1) * -1)', insetInlineStart: 'calc(var(--sp-1) * 3)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 'var(--sp-4)', paddingInline: 'calc(var(--sp-1) * 1)',
  borderRadius: 'var(--r-pill)',
  background: 'var(--crimson)', color: 'var(--color-primary-content)',
  fontFamily: 'var(--font-mono)', fontSize: 'var(--dz-text-2xs)',
  fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-badge)',
};
