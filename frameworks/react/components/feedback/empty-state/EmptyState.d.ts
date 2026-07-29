import * as React from 'react';

export interface EmptyStateProps {

  icon?: string;

  title: string;
  message?: string;
  action?: React.ReactNode;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
