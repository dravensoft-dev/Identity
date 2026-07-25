import * as React from 'react';
/** Confirmation for high-consequence actions. Does not close on click-outside — Escape
 * and the Cancel button are the dismissal paths, both reporting through `onCancel`.
 * `requireText` requires typing a word. */
export interface ConfirmDialogProps {
  open?: boolean; onCancel?: () => void; onConfirm?: () => void;
  /** Required: `aria-labelledby` points at it, and a modal with no name is worse
   *  than none at all. Guarded at runtime — nothing can derive a name for a
   *  confirmation, because its subject is editorial. */
  title: string; eyebrow?: string; children?: React.ReactNode;
  confirmLabel?: string; cancelLabel?: string;
  destructive?: boolean; requireText?: string;
}
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element | null;
