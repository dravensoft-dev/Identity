import * as React from 'react';
/** Error state with recovery. `onRetry` shows the Retry button; `code` exposes the diagnostic. */
export interface ErrorStateProps {
  icon?: React.ReactNode; title?: string; message?: string; code?: string;
  onRetry?: () => void; retryLabel?: string; secondaryAction?: React.ReactNode; style?: React.CSSProperties;
}
export function ErrorState(props: ErrorStateProps): JSX.Element;
