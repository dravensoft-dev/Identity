import type { SelectOption } from '../../../Api.generated';
/** Styled native dropdown selector. */
export type { SelectOption };
export interface SelectProps {
  /** Field label above the control. */
  label?: string;
  /** The choices, drawn as native options. */
  options?: SelectOption[];
  /** The selected option's value. */
  value?: string;
  /** Blocks the control and dims it. */
  disabled?: boolean;
  /** Must have a value for the form to submit. */
  required?: boolean;
  /** Submitted with the form. */
  name?: string;
  /** Allow multiple selection. */
  multiple?: boolean;
  /** A different option was chosen; carries its value. */
  onChange?: (value: string) => void;
}
export function Select(props: SelectProps): JSX.Element;
