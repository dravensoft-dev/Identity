import React from 'react';
export interface TooltipProps {
    label: string;
    children: React.ReactNode;
}
export declare function Tooltip({ children, label }: TooltipProps): React.JSX.Element;
