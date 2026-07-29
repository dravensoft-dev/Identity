export interface TextareaProps {

  label?: string;

  id?: string;

  hint?: string;

  error?: string;

  required?: boolean;

  counter?: boolean;

  autoResize?: boolean;

  value?: string;

  disabled?: boolean;

  readOnly?: boolean;

  placeholder?: string;

  name?: string;

  maxLength?: number;

  rows?: number;

  onChange?: (value: string) => void;
}
export function Textarea(props: TextareaProps): JSX.Element;
