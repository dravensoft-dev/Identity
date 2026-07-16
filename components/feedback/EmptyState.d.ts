import * as React from 'react';
/** Guided empty state. `action` is usually a Button that creates the first item. */
export interface EmptyStateProps {
  icon?: React.ReactNode; title?: string; message?: string; action?: React.ReactNode; style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
