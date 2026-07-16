import * as React from 'react';
/** Grupo de selección única. Controla el valor y reparte estado a los Radio hijos. */
export interface RadioGroupProps {
  value?: string; onChange?: (value: string) => void; name?: string;
  children?: React.ReactNode; style?: React.CSSProperties;
}
export interface RadioProps {
  value: string; label?: string; hint?: string; disabled?: boolean; style?: React.CSSProperties;
}
export function RadioGroup(props: RadioGroupProps): JSX.Element;
export function Radio(props: RadioProps): JSX.Element;
