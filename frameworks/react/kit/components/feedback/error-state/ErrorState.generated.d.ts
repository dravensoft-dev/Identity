import React from 'react';
export interface ErrorStateProps {
    icon?: string;
    title?: string;
    message?: string;
    code?: string;
    retryLabel?: string;
    onRetry?: () => void;
    secondaryAction?: React.ReactNode;
}
export declare function ErrorState({ icon, title, message, code, retryLabel, onRetry, secondaryAction }: ErrorStateProps): React.JSX.Element;
