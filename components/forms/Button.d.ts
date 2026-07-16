import * as React from 'react';
/**
 * Botón de acción de Arena. Primario carmesí para la acción principal (uno por vista);
 * secondary para acciones neutrales, ghost para terciarias, danger para acciones destructivas.
 * @startingPoint section="Forms" subtitle="Botón con variantes y estados" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  full?: boolean;
}
export function Button(props: ButtonProps): JSX.Element;
