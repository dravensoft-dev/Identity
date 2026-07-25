import type { InputType, ValidateOn } from '../../api.generated';
/** Text field with validation. Focus is a gold ring; error crimson; valid green with a check. */
export interface InputProps {
  /** Field label above the control. */
  label?: string;
  /** A line of help under the field. */
  hint?: string;
  /** Controlled error message; wins over `validate`. */
  error?: string;
  /** Force the valid (green check) state. */
  valid?: boolean;
  /** Marks the label and the control required. */
  required?: boolean;
  /** Called on the value; returns the error message, or empty for valid. */
  validate?: (value: string) => string | null | undefined;
  /** When `validate` runs. */
  validateOn?: ValidateOn;
  /**
   * Native input type.
   *
   * @startingPoint `date`, `time` and `datetime-local` are supported and styled
   * for both themes — Arena deliberately ships no DatePicker; the native control
   * is the sanctioned approach.
   */
  type?: InputType;
  /** Phosphor class name drawn at the field's start. */
  icon?: string;
  /** Static text Arena draws before the value, e.g. `git@`. */
  prefix?: string;
  /** The controlled text. */
  value?: string;
  /** Blocks editing and dims it. */
  disabled?: boolean;
  /** Shows the value but blocks editing. */
  readOnly?: boolean;
  /** Shown when empty. */
  placeholder?: string;
  /** Submitted with the form. */
  name?: string;
  /** The browser autofill hint. */
  autoComplete?: string;
  /** Minimum, for number/date types. */
  min?: string;
  /** Maximum, for number/date types. */
  max?: string;
  /** Step, for number/date types. */
  step?: string;
  /** Caps the length. */
  maxLength?: number;
  /** A regex the value must match. */
  pattern?: string;
  /** Edited; carries the new value. */
  onChange?: (value: string) => void;
  /** Left the field; carries the value. */
  onBlur?: (value: string) => void;
}
export function Input(props: InputProps): JSX.Element;
