import * as React from 'react';
/** Barra de progreso (H1). Determinada por defecto (`value` 0–100); `indeterminate` para esperas sin porcentaje. */
export interface ProgressBarProps {
  /** 0–100. Ignorado si `indeterminate`. */
  value?: number;
  indeterminate?: boolean;
  tone?: 'accent' | 'gold' | 'success' | 'danger' | 'info';
  label?: React.ReactNode;
  /** Muestra el % junto a la etiqueta (solo en modo determinado). */
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
