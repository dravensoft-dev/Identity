import React from 'react';
export interface DoughnutChartProps {
    labels: string[];
    values: number[];
    seriesLabel: string;
    slots?: number[];
    valueSuffix?: string;
}
export declare function DoughnutChart({ labels, values, seriesLabel, slots, valueSuffix }: DoughnutChartProps): React.JSX.Element;
