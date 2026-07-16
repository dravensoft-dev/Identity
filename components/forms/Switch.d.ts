import * as React from 'react';
/** Interruptor on/off. Encendido = carmesí. Para ajustes binarios inmediatos. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean; label?: React.ReactNode;
  /** Toggle de alto impacto (H5): desvía el cambio a `onRequestChange` para confirmarlo antes. */
  confirm?: boolean;
  /** Recibe el valor propuesto cuando `confirm` está activo. Abre aquí un ConfirmDialog. */
  onRequestChange?: (next: boolean) => void;
}
export function Switch(props: SwitchProps): JSX.Element;
