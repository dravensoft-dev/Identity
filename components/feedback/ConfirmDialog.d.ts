import * as React from 'react';
/** Confirmation for high-consequence actions. Does not close on click-outside. `requireText` requires typing a word. */
export interface ConfirmDialogProps {
  open: boolean; onCancel?: () => void; onConfirm?: () => void;
  title?: string; eyebrow?: string; children?: React.ReactNode;
  confirmLabel?: string; cancelLabel?: string;
  destructive?: boolean; requireText?: string; width?: number;
}
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null;
