import * as React from 'react';
/** Casilla. Marcada = relleno carmesí con check. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean; label?: string;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
