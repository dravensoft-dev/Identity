import * as React from 'react';
/** On/off switch. On = crimson. For immediate binary settings. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean; label?: React.ReactNode;
  /** High-impact toggle (H5): redirects the change to `onRequestChange` to confirm it first. */
  confirm?: boolean;
  /** Receives the proposed value when `confirm` is active. Open a ConfirmDialog here. */
  onRequestChange?: (next: boolean) => void;
}
export function Switch(props: SwitchProps): JSX.Element;
