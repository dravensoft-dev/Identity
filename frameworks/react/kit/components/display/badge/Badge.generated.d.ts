import React from 'react';
import type { Tone } from '../../../Api.generated';
export interface BadgeProps {
    children?: React.ReactNode;
    tone?: Tone;
    dot?: boolean;
}
export declare function Badge({ children, tone, dot }: BadgeProps): React.JSX.Element;
