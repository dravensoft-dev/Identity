import * as React from 'react';
/** Modal dialog with a blurred overlay. Closes on click-outside or via onClose. */
export interface DialogProps {
  open: boolean; onClose?: () => void;
  title?: string; eyebrow?: string;
  children?: React.ReactNode; footer?: React.ReactNode; width?: number;
}
export function Dialog(props: DialogProps): JSX.Element | null;
