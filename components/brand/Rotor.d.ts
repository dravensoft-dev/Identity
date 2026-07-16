import * as React from 'react';
/** Marca "Rotor" de Dravensoft. NO usar como icono funcional. spin solo en splash/carga.
 * @startingPoint section="Brand" subtitle="Símbolo de marca" viewport="700x160" */
export interface RotorProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number; color?: string; spin?: boolean;
}
export function Rotor(props: RotorProps): JSX.Element;
