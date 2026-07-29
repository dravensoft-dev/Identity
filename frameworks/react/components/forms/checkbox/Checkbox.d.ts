/** A single checkbox. Checked shows a crimson fill with a check. */
export interface CheckboxProps {
  /** Whether it is ticked. */
  checked?: boolean;
  /** Text beside the box. */
  label?: string;
  /** Blocks toggling and dims it. */
  disabled?: boolean;
  /** Must be checked for the form to submit. */
  required?: boolean;
  /** Submitted with the form. */
  name?: string;
  /** The value submitted under `name` when checked. */
  value?: string;
  /** Toggled; carries the new checked state. */
  onChange?: (checked: boolean) => void;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
