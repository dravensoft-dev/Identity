import * as React from 'react';
/** Single-selection group. Controls the value and distributes state to the child Radios. */
export interface RadioGroupProps {
  value?: string; onChange?: (value: string) => void; name?: string;
  children?: React.ReactNode; style?: React.CSSProperties;
}
export interface RadioProps {
  value: string; label?: string; hint?: string; disabled?: boolean; style?: React.CSSProperties;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
export function Radio(props: RadioProps): JSX.Element;
