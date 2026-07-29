/** One option inside a RadioGroup. Selected = crimson dot inside the ring. */
export interface RadioProps {
  /** This option's value, matched against the group's. */
  value: string;
  /** The option's label. */
  label?: string;
  /** A line of help under the label. */
  hint?: string;
  /** Blocks selection and dims the option. */
  disabled?: boolean;
}
export function Radio(props: RadioProps): JSX.Element;
