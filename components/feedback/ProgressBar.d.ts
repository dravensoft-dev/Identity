import * as React from 'react';
/** Progress bar (H1). Determinate by default (`value` 0–100); `indeterminate` for waits without a percentage. */
export interface ProgressBarProps {
  /** 0–100. Ignored if `indeterminate`. */
  value?: number;
  indeterminate?: boolean;
  tone?: 'accent' | 'gold' | 'success' | 'danger' | 'info';
  label?: React.ReactNode;
  /** Shows the % next to the label (determinate mode only). */
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
