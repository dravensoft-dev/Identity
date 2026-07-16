import * as React from 'react';
/** Ephemeral notification. Side bar colored by tone. `action` = button (Undo / Retry / View logs). */
export interface ToastAction { label: string; onClick: () => void; }
export interface ToastProps {
  title?: string; message?: string;
  tone?: 'neutral' | 'success' | 'danger' | 'gold';
  action?: ToastAction;
  /** Disables the host's auto-dismiss (H1). Always use it in critical/error states. */
  persist?: boolean;
  onClose?: () => void; style?: React.CSSProperties;
}
export function Toast(props: ToastProps): JSX.Element;
