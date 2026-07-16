import * as React from 'react';
/** Dravensoft's "Rotor" mark. Do NOT use as a functional icon. spin only in splash/loading.
 * @startingPoint section="Brand" subtitle="Brand symbol" viewport="700x160" */
export interface RotorProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number; color?: string; spin?: boolean;
}
export function Rotor(props: RotorProps): JSX.Element;
