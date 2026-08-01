import React from 'react';
export interface ConfirmDialogProps {
    open: boolean;
    onCancel?: () => void;
    onConfirm?: () => void;
    title: string;
    eyebrow?: string;
    children?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    requireText?: string;
}
export declare function confirmStyle(destructive: boolean, hover: boolean, locked: boolean): React.CSSProperties;
export declare function ConfirmDialog({ open, onCancel, onConfirm, title, eyebrow, children, confirmLabel, cancelLabel, destructive, requireText }: ConfirmDialogProps): React.JSX.Element | null;
