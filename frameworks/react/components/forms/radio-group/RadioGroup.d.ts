import * as React from 'react';
/** Single-selection group. Governs the value and distributes it to child Radios. */
export interface RadioGroupProps {
  /** The Radios. RadioGroup injects each one's selected state. */
  children?: React.ReactNode;
  /** The selected option's value. */
  value?: string;
  /** Shared name for the underlying radios; generated when omitted. */
  name?: string;
  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
