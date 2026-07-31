import type { SelectOption } from '../../../Api.generated';

export type { SelectOption };
export interface SelectProps {

  label?: string;

  options?: SelectOption[];

  value?: string;

  disabled?: boolean;

  required?: boolean;

  name?: string;


  onChange?: (value: string) => void;
}
export function Select(props: SelectProps): JSX.Element;
