export interface DoughnutChartProps {

  labels: string[];

  values: number[];

  seriesLabel: string;

  slots?: number[];

  valueSuffix?: string;
}

export function DoughnutChart(props: DoughnutChartProps): JSX.Element;
