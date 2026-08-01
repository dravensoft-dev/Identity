import React from 'react';
export interface ChartCardProps {
    title?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}
export declare function ChartCard({ title, actions, children }: ChartCardProps): React.JSX.Element;
