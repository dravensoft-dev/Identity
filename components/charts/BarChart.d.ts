import * as React from 'react';

/** A slot in the categorical ramp. Fixed order, never cycled. */
export type CatSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** For a series that IS a state (error rate, pass/fail). */
export type SeriesTone = 'success' | 'warning' | 'danger' | 'info';

export interface BarChartProps {
  /** One label per bar. Same length as `values`. */
  labels: string[];
  values: number[];
  /** Names the series for the accessible table and the tooltip. */
  seriesLabel?: string;
  /** @startingPoint One identity color for every bar. Defaults to slot 1. */
  slot?: CatSlot;
  /** Per-bar identity override. Wins over `slot`. */
  slots?: CatSlot[];
  /** Semantic override. Mutually exclusive with slot/slots — passing both warns
   *  in development and `tone` wins. A chart carries identity or meaning, never both. */
  tone?: SeriesTone;
  valueFormatter?: (value: number) => string;
  style?: React.CSSProperties;
}
export function BarChart(props: BarChartProps): JSX.Element;
