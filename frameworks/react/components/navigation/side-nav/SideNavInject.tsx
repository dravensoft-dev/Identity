import React from 'react';

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
