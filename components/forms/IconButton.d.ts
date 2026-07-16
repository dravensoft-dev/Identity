import * as React from 'react';
/** Botón solo-icono. Requiere `label` para accesibilidad. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'solid';
  label: string;
  /** Muestra el `label` como texto junto al icono (H6). No dependas solo del tooltip. */
  showLabel?: boolean;
}
export function IconButton(props: IconButtonProps): JSX.Element;
