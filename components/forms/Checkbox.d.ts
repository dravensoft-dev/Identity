import * as React from 'react';
/** Checkbox. Checked = crimson fill with check. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean; label?: string;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
