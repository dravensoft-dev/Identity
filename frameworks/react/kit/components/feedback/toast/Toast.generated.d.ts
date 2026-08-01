import React from 'react';
import type { ToastTone } from '../../../Api.generated';
export interface ToastProps {
    title?: string;
    message?: string;
    tone?: ToastTone;
    actionLabel?: string;
    onAction?: () => void;
    persist?: boolean;
    dismissible?: boolean;
    onClose?: () => void;
}
export declare function Toast({ title, message, tone, actionLabel, onAction, dismissible, onClose, persist }: ToastProps): React.JSX.Element;
