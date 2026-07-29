import * as React from 'react';
import type { AlertTone } from '../../../Api.generated';

export interface AlertProps {
  tone?: AlertTone;
  title?: string; children?: React.ReactNode; icon?: string;
  actionLabel?: string; onAction?: () => void;
  dismissible?: boolean; onClose?: () => void;
}
export function Alert(props: AlertProps): JSX.Element;
