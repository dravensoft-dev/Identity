import React from 'react';
export interface CardProps {
    children?: React.ReactNode;
    title?: string;
    eyebrow?: string;
    action?: React.ReactNode;
    floating?: boolean;
    accent?: boolean;
}
export declare function Card({ children, title, eyebrow, action, floating, accent }: CardProps): React.JSX.Element;
