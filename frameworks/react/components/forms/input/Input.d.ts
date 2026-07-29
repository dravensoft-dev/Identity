import type { InputType, ValidateOn } from '../../../Api.generated';

export interface InputProps {

  label?: string;

  id?: string;

  hint?: string;

  error?: string;

  valid?: boolean;

  required?: boolean;

  validate?: (value: string) => string | null | undefined;

  validateOn?: ValidateOn;

  type?: InputType;

  icon?: string;

  prefix?: string;

  value?: string;

  disabled?: boolean;

  readOnly?: boolean;

  placeholder?: string;

  name?: string;

  autoComplete?: string;

  min?: string;

  max?: string;

  step?: string;

  maxLength?: number;

  pattern?: string;

  onChange?: (value: string) => void;

  onBlur?: (value: string) => void;
}
export function Input(props: InputProps): JSX.Element;
