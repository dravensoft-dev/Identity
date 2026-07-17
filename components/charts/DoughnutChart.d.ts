import * as React from 'react';
import { CatSlot } from './BarChart';

export type { CatSlot } from './BarChart';

export interface DoughnutChartProps {
  labels: string[];
  values: number[];
  /** @startingPoint Omit it — slots default to 1..N in order, which is the rule. */
  slots?: CatSlot[];
  valueFormatter?: (value: number) => string;
  style?: React.CSSProperties;
}
/** Parts of one whole. Identity only — a slice is a category by definition,
 *  so there is deliberately no `tone`. Always draws its legend. */
export function DoughnutChart(props: DoughnutChartProps): JSX.Element;
