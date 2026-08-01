import React from 'react';
import type { SeriesTone } from '../../../Api.generated';
export type { SeriesTone };
export interface BarChartProps {
    labels: string[];
    values: number[];
    seriesLabel: string;
    slot?: number;
    slots?: number[];
    tone?: SeriesTone;
    valueSuffix?: string;
}
export declare function BarChart({ labels, values, seriesLabel, slot, slots, tone, valueSuffix, }: BarChartProps): React.JSX.Element;
