import React from 'react';
import type { AlertTone } from '../../../Api.generated';
export interface AlertProps {
    tone?: AlertTone;
    title?: string;
    children?: React.ReactNode;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    dismissible?: boolean;
    onClose?: () => void;
}
export declare function Alert({ tone, title, children, icon, actionLabel, onAction, dismissible, onClose }: AlertProps): React.JSX.Element;
