import React from 'react';
import { injectInto, COLUMN } from './SideNavInject.tsx';

export interface SideNavProps {

  children?: React.ReactNode;

  active?: string;

  ariaLabel: string;

  indentStep?: number;

  onNav?: (id: string) => void;
}


export function SideNav({ children, active, ariaLabel, indentStep = 3, onNav }: SideNavProps) {

  if (!ariaLabel?.trim()) throw new Error('SideNav: `ariaLabel` is required');
  return (
    <nav aria-label={ariaLabel} style={COLUMN}>
      {injectInto(children, { depth: 0, activeId: active, indentStep, onActivate: onNav })}
    </nav>
  );
}
