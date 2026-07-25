import type { SegmentOption, SegmentedControlSize } from '../../api.generated';
/** A compact inline filter over mutually exclusive options. A real radio group,
 *  never a tab list, and it carries no crimson. */
export type { SegmentOption };
export interface SegmentedControlProps {
  /** @startingPoint The options, in order. Two to four with one-word labels. */
  options: SegmentOption[];
  /** The selected option's value. Omit and pass `defaultValue` to let it govern itself. */
  value?: string;
  /** The initially selected value when uncontrolled. Defaults to the first option. */
  defaultValue?: string;
  /** Compact or default. */
  size?: SegmentedControlSize;
  /** Names what is being filtered — "Time range", not "Filter". A radio group with
   *  no accessible name is announced unlabelled. */
  ariaLabel: string;
  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;
  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
