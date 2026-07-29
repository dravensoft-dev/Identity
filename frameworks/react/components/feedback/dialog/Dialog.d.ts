import * as React from 'react';

export interface DialogProps {

  open: boolean;

  title: string;

  eyebrow?: string;

  width?: string;

  children?: React.ReactNode;

  footer?: React.ReactNode;

  onClose?: () => void;
}
export function Dialog(props: DialogProps): JSX.Element | null;
