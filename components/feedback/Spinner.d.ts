import * as React from 'react';

/** Indeterminate wait indicator. For a measurable process use ProgressBar instead. */
export interface SpinnerProps {
  /** 14px / 20px / 32px. */
  size?: 'sm' | 'md' | 'lg';
  /**
   * @startingPoint 'accent' on a page surface, 'on-accent' inside a filled button.
   * `accent` and `gold` are the same tokens ProgressBar uses. There is deliberately
   * no success/warning/danger tone: an indeterminate wait has no state to report.
   */
  tone?: 'accent' | 'gold' | 'neutral' | 'on-accent';
  /** Accessible name. Defaults to "Loading". Say what is loading when you can. */
  label?: string;
  style?: React.CSSProperties;
}
export function Spinner(props: SpinnerProps): JSX.Element;
