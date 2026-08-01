import React from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.generated.js';
export interface SideNavSectionProps {
    label: string;
    children: React.ReactNode;
}
export declare function SideNavSection({ label, children, depth, activeId, indentStep, onActivate, }: SideNavSectionProps & Partial<SideNavInjected>): React.JSX.Element;
