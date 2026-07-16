import * as React from 'react';
/** Notificación efímera. Barra lateral por tono. `action` = botón (Deshacer / Reintentar / Ver logs). */
export interface ToastAction { label: string; onClick: () => void; }
export interface ToastProps {
  title?: string; message?: string;
  tone?: 'neutral' | 'success' | 'danger' | 'gold';
  action?: ToastAction;
  /** Desactiva el autodescarte del host (H1). Úsalo siempre en estados crítico/error. */
  persist?: boolean;
  onClose?: () => void; style?: React.CSSProperties;
}
export function Toast(props: ToastProps): JSX.Element;
