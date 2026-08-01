import React from 'react';
import type { ControlSize, SpinnerTone } from '../../../Api.generated';
export interface SpinnerProps {
    size?: ControlSize;
    tone?: SpinnerTone;
    label?: string;
}
export declare function Spinner({ size, tone, label }: SpinnerProps): React.JSX.Element;
