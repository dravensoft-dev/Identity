import React from 'react';
export interface DialogProps {
    open: boolean;
    title: string;
    eyebrow?: string;
    width?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
}
export declare function Dialog({ open, onClose, title, eyebrow, children, footer, width }: DialogProps): React.JSX.Element | null;
