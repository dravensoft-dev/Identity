import * as React from 'react';
import type { ControlSize, ProgressTone } from '../../../Api.generated';

export interface ProgressBarProps {

  progressPercentage?: number;

  indeterminate?: boolean;

  tone?: ProgressTone;

  label: string;

  showPercentage?: boolean;

  size?: ControlSize;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
