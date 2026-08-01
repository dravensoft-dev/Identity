import React from 'react';
import type { SideNavInjected } from '../side-nav/SideNavInject.generated.js';
export interface SideNavCollapsibleProps {
    id: string;
    label: string;
    icon?: string;
    defaultExpanded?: boolean;
    children?: React.ReactNode;
    onToggle?: (expanded: boolean) => void;
}
export declare function subtreeHasItem(children: React.ReactNode, id: string | undefined): boolean;
export declare function SideNavCollapsible({ id, label, icon, defaultExpanded, children, onToggle, depth, activeId, indentStep, onActivate, }: SideNavCollapsibleProps & Partial<SideNavInjected>): React.JSX.Element;
