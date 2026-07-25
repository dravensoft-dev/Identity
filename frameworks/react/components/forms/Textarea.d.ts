/** Multi-line text field with validation and an optional counter. */
export interface TextareaProps {
  /** Field label; the counter and error sit under the field. */
  label?: string;
  /** A line of help under the field. */
  hint?: string;
  /** Error message; turns the border crimson and shows below. */
  error?: string;
  /** Marks the label and the control required. */
  required?: boolean;
  /** Shows a live length/maxLength count. */
  counter?: boolean;
  /** Grows with the content instead of scrolling. */
  autoResize?: boolean;
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
  /** Caps the length; feeds the counter. */
  maxLength?: number;
  /** Initial visible rows. */
  rows?: number;
  /** Edited; carries the new text. */
  onChange?: (value: string) => void;
}
export function Textarea(props: TextareaProps): JSX.Element;
