import type { Orientation, SwitchSize } from '../../api.generated';
/** A controlled on/off switch showing an icon per state. On = crimson.
 *  `confirm` (H5): a high-impact change is not applied on the fly — it is
 *  requested through `onRequestChange` so the host can open a ConfirmDialog;
 *  `state` only changes after the host flips it. */
export interface SwitchProps {
  state?: boolean;
  orientation?: Orientation;
  size?: SwitchSize;
  iconOn?: string;
  iconOff?: string;
  label?: string;
  disabled?: boolean;
  confirm?: boolean;
  onFuncOn?: () => void;
  onFuncOff?: () => void;
  onRequestChange?: () => void;
}
export function Switch(props: SwitchProps): JSX.Element;
