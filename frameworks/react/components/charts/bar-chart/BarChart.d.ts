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
export function BarChart(props: BarChartProps): JSX.Element;
