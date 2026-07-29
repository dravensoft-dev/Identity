import * as React from 'react';

export interface ErrorStateProps {
  icon?: string; title?: string; message?: string; code?: string;
  retryLabel?: string; onRetry?: () => void; secondaryAction?: React.ReactNode;
}
export function ErrorState(props: ErrorStateProps): JSX.Element;
