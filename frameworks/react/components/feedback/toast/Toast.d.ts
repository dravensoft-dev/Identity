import * as React from 'react';
import type { ToastTone } from '../../../Api.generated';
/** Ephemeral notification. Side bar colored by tone; `actionLabel` + `onAction` add a button (Undo / Retry / View logs). */
export interface ToastProps {
  /** The bold lead line. */
  title?: string;
  /** The body. */
  message?: string;
  /** The side bar's colour, and whether the toast announces assertively. */
  tone?: ToastTone;
  /** The label of the single inline action — Undo, Retry, View logs. Absent renders no action. */
  actionLabel?: string;
  /** The inline action was activated. */
  onAction?: () => void;
  /** Disables the host's auto-dismiss and shows the Pinned marker (H1). Mandatory in an error state. */
  persist?: boolean;
  /** Whether the × is shown. Both layers gate the × on this — Angular cannot detect a `close` listener. */
  dismissible?: boolean;
  /** The × was activated. */
  onClose?: () => void;
}
export function Toast(props: ToastProps): JSX.Element;
