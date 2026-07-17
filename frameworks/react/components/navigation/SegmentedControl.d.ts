import * as React from 'react';

/** A compact inline filter over mutually exclusive options: an enclosed track
 *  with a neutral raised thumb on the selected one. It is a real radio group
 *  (hidden native inputs under `role="radiogroup"`), not a tab list — Tabs
 *  navigates between views, this filters within one. Carries no crimson. */
export interface SegmentOption { value: string; label: string; }
export interface SegmentedControlProps {
  /** @startingPoint Two to four options with one-word labels. Past that the
   *  track stops being compact and the choice belongs in a Select. */
  options: (string | SegmentOption)[];
  /** Controlled selection. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Compact (28px) or default (34px). Both sit below Button, on purpose. */
  size?: 'sm' | 'md';
  /** Required: a radio group with no accessible name is announced as an
   *  unlabelled group. Name what is being filtered — "Time range", not "Filter". */
  ariaLabel: string;
  /** Shared `name` for the underlying radios. Generated when omitted; pass one
   *  only when the control lives in a real form. */
  name?: string;
  style?: React.CSSProperties;
}
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
