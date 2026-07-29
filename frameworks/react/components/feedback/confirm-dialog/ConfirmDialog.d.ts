import * as React from 'react';

export interface ConfirmDialogProps {
  open?: boolean; onCancel?: () => void; onConfirm?: () => void;

  title: string; eyebrow?: string; children?: React.ReactNode;
  confirmLabel?: string; cancelLabel?: string;
  destructive?: boolean; requireText?: string;
}
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null;
