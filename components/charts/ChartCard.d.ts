import * as React from 'react';

/** The card surface a chart sits on: microlabel title, optional actions, the chart. */
export interface ChartCardProps {
  /** Uppercase muted microlabel — deliberately NOT a heading element.
   *  With one series, this is what names the chart, and no legend is drawn. */
  title?: string;
  /** @startingPoint A range Select, or an IconButton or two. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export function ChartCard(props: ChartCardProps): JSX.Element;
