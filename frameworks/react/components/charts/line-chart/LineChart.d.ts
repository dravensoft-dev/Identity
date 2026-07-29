import type { SeriesTone } from '../../api.generated';

export type { SeriesTone };

/** A line is ONE series, so `slots` (per-mark colors) has no meaning here — the
 *  member list below is flat rather than inherited, because a heritage clause is
 *  the `{...rest}` escape and R4 forbids it. */
export interface LineChartProps {
  /** One label per point, in the same order as `values`. */
  labels: string[];
  /** The plotted data, in order. One point per entry. */
  values: number[];
  /** Names the series for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint The identity color from the categorical ramp. Defaults to slot 1. */
  slot?: number;
  /** Semantic override. Mutually exclusive with slot — passing both warns in
   *  development and `tone` wins. A chart carries identity or meaning, never both. */
  tone?: SeriesTone;
  /** @startingPoint Fill under the line at 18% of the series color — a tint, never a gradient.
   *  Use it for a single series; with two lines the fills occlude each other. */
  area?: boolean;
  /** Appended verbatim to every number drawn: the axis ticks, the tooltip and the
   *  accessible table. Carries its own leading space if one is wanted (`' ms'` vs `'%'`). */
  valueSuffix?: string;
}
export function LineChart(props: LineChartProps): JSX.Element;
