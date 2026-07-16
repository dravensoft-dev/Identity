import * as React from 'react';
/** Campo de texto con validación (H5). Foco = anillo oro; error = carmesí; válido = verde + check.
 * `validate(value)` devuelve el mensaje de error o null; `validateOn` controla cuándo se evalúa. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string; hint?: string; error?: string;
  valid?: boolean; required?: boolean;
  validate?: (value: string) => string | null | undefined;
  validateOn?: 'blur' | 'change';
  icon?: React.ReactNode; prefix?: React.ReactNode;
}
export function Input(props: InputProps): JSX.Element;
