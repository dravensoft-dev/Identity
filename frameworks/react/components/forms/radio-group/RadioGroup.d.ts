import * as React from 'react';

export interface RadioGroupProps {

  ariaLabel: string;

  children?: React.ReactNode;

  value?: string;

  name?: string;

  onChange?: (value: string) => void;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
