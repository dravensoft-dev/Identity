import * as React from 'react';
import type { ToastTone } from '../../../Api.generated';

export interface ToastProps {

  title?: string;

  message?: string;

  tone?: ToastTone;

  actionLabel?: string;

  onAction?: () => void;

  persist?: boolean;

  dismissible?: boolean;

  onClose?: () => void;
}
export function Toast(props: ToastProps): JSX.Element;
