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
