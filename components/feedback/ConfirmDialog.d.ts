import * as React from 'react';
/** Confirmación para acciones de consecuencia alta. No cierra por clic-fuera. `requireText` exige teclear una palabra. */
export interface ConfirmDialogProps {
  open: boolean; onCancel?: () => void; onConfirm?: () => void;
  title?: string; eyebrow?: string; children?: React.ReactNode;
  confirmLabel?: string; cancelLabel?: string;
  destructive?: boolean; requireText?: string; width?: number;
}
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null;
