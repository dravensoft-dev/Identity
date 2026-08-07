import React from 'react';

export interface ArenaBottomNavInjected {
  activeId?: string;
  onActivate?: (id: string) => void;
}

export function arenaInjectInto(children: React.ReactNode, injected: ArenaBottomNavInjected): React.ReactNode[] {
  return React.Children.toArray(children).map((child) => (
    React.isValidElement<Partial<ArenaBottomNavInjected>>(child) ? React.cloneElement(child, injected) : child
  ));
}
