export interface CheckboxProps {

  checked?: boolean;

  label?: string;

  disabled?: boolean;

  required?: boolean;

  name?: string;

  value?: string;

  onChange?: (checked: boolean) => void;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
