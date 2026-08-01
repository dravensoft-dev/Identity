import React from 'react';
export interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    action?: React.ReactNode;
}
export declare function EmptyState({ icon, title, message, action }: EmptyStateProps): React.JSX.Element;
