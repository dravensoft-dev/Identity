import * as React from 'react';
/** Estado de error con recuperación. `onRetry` muestra el botón Reintentar; `code` expone el diagnóstico. */
export interface ErrorStateProps {
  icon?: React.ReactNode; title?: string; message?: string; code?: string;
  onRetry?: () => void; retryLabel?: string; secondaryAction?: React.ReactNode; style?: React.CSSProperties;
}
export function ErrorState(props: ErrorStateProps): JSX.Element;
