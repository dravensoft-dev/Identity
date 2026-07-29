import type { SeriesTone } from '../../../Api.generated';

export type { SeriesTone };

export interface LineChartProps {

  labels: string[];

  values: number[];

  seriesLabel?: string;

  slot?: number;

  tone?: SeriesTone;

  area?: boolean;

  valueSuffix?: string;
}
export function LineChart(props: LineChartProps): JSX.Element;
