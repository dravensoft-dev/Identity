import * as React from 'react';
/** Contenedor de superficie. Borde hairline; `floating` añade sombra; `accent` borde carmesí.
 * @startingPoint section="Display" subtitle="Tarjeta de superficie con cabecera" viewport="700x220" */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string; eyebrow?: string; action?: React.ReactNode;
  floating?: boolean; accent?: boolean;
}
export function Card(props: CardProps): JSX.Element;
