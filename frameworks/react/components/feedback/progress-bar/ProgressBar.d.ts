import * as React from 'react';
import type { ControlSize, ProgressTone } from '../../../Api.generated';
/** Progress bar (H1). Determinate by default (`progressPercentage` 0–100); `indeterminate` for waits without a percentage. */
export interface ProgressBarProps {
  /** How far along, 0–100. Clamped and rounded. Ignored when `indeterminate`. */
  progressPercentage?: number;
  /** A wait with no percentage; the bar sweeps instead of filling. */
  indeterminate?: boolean;
  /** The bar's colour. */
  tone?: ProgressTone;
  /** Names what is progressing. Drawn above the bar, and it is the bar's accessible name. */
  label?: string;
  /** Shows the percentage beside the label. Determinate only. */
  showPercentage?: boolean;
  /** The bar's thickness. */
  size?: ControlSize;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
