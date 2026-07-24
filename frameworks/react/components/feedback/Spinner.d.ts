import type { ControlSize, SpinnerTone } from '../../api.generated';

/** Indeterminate wait indicator. For a measurable process use ProgressBar instead. */
export interface SpinnerProps {
  /** `--icon-sm` (14px) / `--sp-5` (20px) / `--sp-8` (32px). */
  size?: ControlSize;
  /**
   * @startingPoint 'accent' on a page surface, 'on-accent' inside a filled button.
   * `accent` and `gold` are the same tokens ProgressBar uses. There is deliberately
   * no success/warning/danger tone: an indeterminate wait has no state to report.
   */
  tone?: SpinnerTone;
  /** Accessible name. Defaults to "Loading". Say what is loading when you can. */
  label?: string;
}
export function Spinner(props: SpinnerProps): JSX.Element;
