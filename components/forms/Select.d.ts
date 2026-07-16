import * as React from 'react';
/** Selector desplegable nativo estilizado. options: string[] o {value,label}[]. */
export interface SelectOption { value: string; label: string; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: (string | SelectOption)[];
}
export function Select(props: SelectProps): JSX.Element;
