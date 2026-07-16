import * as React from 'react';
/** Styled native dropdown selector. options: string[] or {value,label}[]. */
export interface SelectOption { value: string; label: string; }
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: (string | SelectOption)[];
}
export function Select(props: SelectProps): JSX.Element;
