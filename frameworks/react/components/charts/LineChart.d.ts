import * as React from 'react';
import { BarChartProps } from './BarChart';

export type { SeriesTone } from './BarChart';

/** A line is ONE series, so `slots` (per-mark colors) has no meaning here. */
export interface LineChartProps extends Omit<BarChartProps, 'slots'> {
  /** @startingPoint Fill under the line at 18% of the series color — a tint, never a gradient.
   *  Use it for a single series; with two lines the fills occlude each other. */
  area?: boolean;
}
export function LineChart(props: LineChartProps): JSX.Element;
