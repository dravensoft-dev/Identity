import * as React from 'react';
/** Error state with recovery. `retryLabel` draws the Retry button (and gates it -- absent
 *  renders none); `code` exposes the diagnostic. */
export interface ErrorStateProps {
  icon?: string; title?: string; message?: string; code?: string;
  retryLabel?: string; onRetry?: () => void; secondaryAction?: React.ReactNode;
}
export function ErrorState(props: ErrorStateProps): JSX.Element;
