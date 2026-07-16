import * as React from 'react';
/** Mensaje persistente embebido en la página (banner inline). */
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  title?: string; children?: React.ReactNode; icon?: string;
  action?: { label: string; onClick: () => void }; onClose?: () => void; style?: React.CSSProperties;
}
export function Alert(props: AlertProps): JSX.Element;
