import React from 'react';
import type { ControlSize, ProgressTone } from '../../../Api.generated';
export interface ProgressBarProps {
    progressPercentage?: number;
    indeterminate?: boolean;
    tone?: ProgressTone;
    label: string;
    showPercentage?: boolean;
    size?: ControlSize;
}
export declare function ProgressBar({ progressPercentage, indeterminate, tone, label, showPercentage, size }: ProgressBarProps): React.JSX.Element;
