import type { SegmentOption, SegmentedControlSize } from '../../../Api.generated';

export type { SegmentOption };
export interface SegmentedControlProps {

  options: SegmentOption[];

  value?: string;

  defaultValue?: string;

  size?: SegmentedControlSize;

  ariaLabel: string;

  name?: string;

  onChange?: (value: string) => void;
}
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
