import React from 'react';
export interface SideNavProps {
    children?: React.ReactNode;
    active?: string;
    ariaLabel: string;
    indentStep?: number;
    onNav?: (id: string) => void;
}
export declare function SideNav({ children, active, ariaLabel, indentStep, onNav }: SideNavProps): React.JSX.Element;
