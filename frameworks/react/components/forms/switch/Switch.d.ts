import type { Orientation, SwitchSize } from '../../../Api.generated';

export interface SwitchProps {
  state?: boolean;
  orientation?: Orientation;
  size?: SwitchSize;
  iconOn?: string;
  iconOff?: string;
  label: string;
  disabled?: boolean;
  confirm?: boolean;
  onFuncOn?: () => void;
  onFuncOff?: () => void;
  onRequestChange?: () => void;
}
export function Switch(props: SwitchProps): JSX.Element;
