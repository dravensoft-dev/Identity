import React from 'react';
import type { SeriesTone } from '../../../Api.generated';
export type { SeriesTone };
export interface LineChartProps {
    labels: string[];
    values: number[];
    seriesLabel: string;
    slot?: number;
    tone?: SeriesTone;
    area?: boolean;
    valueSuffix?: string;
}
export declare function LineChart({ labels, values, seriesLabel, slot, tone, area, valueSuffix, }: LineChartProps): React.JSX.Element;
