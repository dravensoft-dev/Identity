import * as React from 'react';
/** Placeholder de carga para datos asíncronos (H1). Reserva el layout del contenido real. */
export interface SkeletonProps {
  variant?: 'text' | 'line' | 'block' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Nº de líneas cuando variant='text'. La última sale más corta. */
  lines?: number;
  radius?: string;
  style?: React.CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
