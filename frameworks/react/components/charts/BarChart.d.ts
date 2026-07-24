import type { SeriesTone } from '../../api.generated';

export type { SeriesTone };

export interface BarChartProps {
  /** One label per bar, in the same order as `values`. */
  labels: string[];
  /** The plotted data. One bar per entry. */
  values: number[];
  /** Names the series for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint One identity color for every bar. Defaults to ramp slot 1. */
  slot?: number;
  /** Per-bar identity override, one ramp slot each. Wins over `slot`. */
  slots?: number[];
  /** Semantic override. Mutually exclusive with slot/slots — passing both warns
   *  in development and `tone` wins. A chart carries identity or meaning, never both. */
  tone?: SeriesTone;
  /** Appended verbatim to every number drawn: the axis ticks, the tooltip and the
   *  accessible table. Carries its own leading space if one is wanted (`' ms'` vs `'%'`). */
  valueSuffix?: string;
}
export function BarChart(props: BarChartProps): JSX.Element;
