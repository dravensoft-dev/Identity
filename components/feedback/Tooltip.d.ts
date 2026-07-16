import * as React from 'react';
/** Tooltip al pasar el cursor. Fondo hueso sobre oscuro para contraste. */
export interface TooltipProps {
  content: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}
export function Tooltip(props: TooltipProps): JSX.Element;
