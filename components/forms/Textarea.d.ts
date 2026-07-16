import * as React from 'react';
/** Multi-line text field with validation and an optional counter. */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: string; hint?: string; error?: string; required?: boolean;
  counter?: boolean; autoResize?: boolean; style?: React.CSSProperties;
}
export function Textarea(props: TextareaProps): JSX.Element;
