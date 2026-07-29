import type { ControlSize, SpinnerTone } from '../../../Api.generated';

export interface SpinnerProps {

  size?: ControlSize;

  tone?: SpinnerTone;

  label?: string;
}
export function Spinner(props: SpinnerProps): JSX.Element;
