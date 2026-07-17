import * as React from 'react';
/** Text field with validation (H5). Focus = gold ring; error = crimson; valid = green + check.
 * `validate(value)` returns the error message or null; `validateOn` controls when it's evaluated. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string; hint?: string; error?: string;
  valid?: boolean; required?: boolean;
  validate?: (value: string) => string | null | undefined;
  validateOn?: 'blur' | 'change';
  icon?: React.ReactNode; prefix?: React.ReactNode;
  /**
   * @startingPoint Native input type. `date`, `time` and `datetime-local` are
   * supported and styled for both themes — Arena deliberately ships no
   * DatePicker; the native control is the sanctioned approach.
   */
  type?: React.HTMLInputTypeAttribute;
  /** Merged with Arena's own class, never replacing it. */
  className?: string;
}
export function Input(props: InputProps): JSX.Element;
