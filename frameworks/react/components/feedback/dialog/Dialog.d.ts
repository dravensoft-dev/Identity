import * as React from 'react';
/** Modal dialog over a blurred scrim. Takes the whole interaction until dismissed. */
export interface DialogProps {
  /** Whether the dialog is shown. The host owns it. */
  open: boolean;
  /** Names the dialog for assistive technology and heads it visually. Required: aria-labelledby points at it, and a modal with no name is worse than none at all. */
  title: string;
  /** A short kicker above the title. */
  eyebrow?: string;
  /** A CSS width for the panel. Omit for the default. */
  width?: string;
  /** The dialog's body. */
  children?: React.ReactNode;
  /** The action row, right-aligned. */
  footer?: React.ReactNode;
  /** The dialog was dismissed — by Escape or by a scrim click. No payload. */
  onClose?: () => void;
}
export function Dialog(props: DialogProps): JSX.Element | null;
