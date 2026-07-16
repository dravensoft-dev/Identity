import * as React from 'react';
/** Campo de texto multilínea con validación y contador opcional. */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: string; hint?: string; error?: string; required?: boolean;
  counter?: boolean; autoResize?: boolean; style?: React.CSSProperties;
}
export function Textarea(props: TextareaProps): JSX.Element;
