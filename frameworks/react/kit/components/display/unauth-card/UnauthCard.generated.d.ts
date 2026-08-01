import React from 'react';
export interface UnauthCardProps {
    brand?: React.ReactNode;
    eyebrow?: string;
    title?: string;
    footer?: React.ReactNode;
    children?: React.ReactNode;
}
export declare function UnauthCard({ brand, eyebrow, title, footer, children }: UnauthCardProps): React.JSX.Element;
