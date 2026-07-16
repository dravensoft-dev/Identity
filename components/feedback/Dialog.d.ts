import * as React from 'react';
/** Diálogo modal con overlay difuminado. Cierra al hacer clic fuera o via onClose. */
export interface DialogProps {
  open: boolean; onClose?: () => void;
  title?: string; eyebrow?: string;
  children?: React.ReactNode; footer?: React.ReactNode; width?: number;
}
export function Dialog(props: DialogProps): JSX.Element | null;
