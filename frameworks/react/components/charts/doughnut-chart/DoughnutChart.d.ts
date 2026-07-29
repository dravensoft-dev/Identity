export interface DoughnutChartProps {
  /** One label per slice, in the same order as `values`. */
  labels: string[];
  /** The parts, read as shares of their own total. */
  values: number[];
  /** Names the chart for the accessible name, the table caption and its value column. */
  seriesLabel?: string;
  /** @startingPoint Omit it — slots default to 1..N in order, which is the rule. */
  slots?: number[];
  /** Appended verbatim to every number drawn: the legend value and the accessible
   *  table. Not the centre label, which is a percentage. Carries its own leading
   *  space if one is wanted (`' rps'` vs `'%'`). */
  valueSuffix?: string;
}
/** Parts of one whole. Identity only — a slice is a category by definition,
 *  so there is deliberately no `tone`. Always draws its legend. */
export function DoughnutChart(props: DoughnutChartProps): JSX.Element;
