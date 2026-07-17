import * as React from 'react';

/** A single metric on the card surface: label, big value, optional delta pill. */
export interface StatDelta {
  /** Preformatted, e.g. "+12%" or "-340ms". StatCard never formats. */
  value: string;
  /** Which way the number moved. Draws the arrow — nothing else. */
  direction: 'up' | 'down';
  /**
   * Whether that movement is GOOD. Deliberately separate from `direction`:
   * revenue down is negative, latency down is positive, and only the product
   * knows which. Defaults to 'neutral' — an unlabelled delta claims nothing.
   */
  tone?: 'positive' | 'negative' | 'neutral';
}
export interface StatCardProps {
  /** Short uppercase microlabel (<= 2 words). */
  label: string;
  /** Preformatted, e.g. "1,284" or "99.9%". */
  value: string;
  delta?: StatDelta;
  /** Small muted line under the value — context, e.g. "vs last week". */
  sub?: string;
  /** @startingPoint A ~14px Phosphor icon; rendered muted at .6 opacity. */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
export function StatCard(props: StatCardProps): JSX.Element;
