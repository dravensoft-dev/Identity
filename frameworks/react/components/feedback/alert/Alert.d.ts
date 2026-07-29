import * as React from 'react';
import type { AlertTone } from '../../api.generated';
/** Persistent message embedded in the page (inline banner). */
export interface AlertProps {
  tone?: AlertTone;
  title?: string; children?: React.ReactNode; icon?: string;
  actionLabel?: string; onAction?: () => void;
  dismissible?: boolean; onClose?: () => void;
}
export function Alert(props: AlertProps): JSX.Element;
