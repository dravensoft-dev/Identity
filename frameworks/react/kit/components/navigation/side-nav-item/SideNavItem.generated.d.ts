import React from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.generated.js';
export interface SideNavItemProps {
    id: string;
    label: string;
    icon?: string;
    href?: string;
    disabled?: boolean;
}
export declare function SideNavItem({ id, label, icon, href, disabled, depth, activeId, indentStep, onActivate, }: SideNavItemProps & Partial<SideNavInjected>): React.JSX.Element;
