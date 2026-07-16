import * as React from 'react';
/** Estado vacío guiado. `action` suele ser un Button que crea el primer elemento. */
export interface EmptyStateProps {
  icon?: React.ReactNode; title?: string; message?: string; action?: React.ReactNode; style?: React.CSSProperties;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
