import * as React from 'react';
/** Dravensoft's "Rotor" mark. Do NOT use as a functional icon. spin only in splash/loading.
 * @startingPoint section="Brand" subtitle="Brand symbol" viewport="700x560" */
export interface RotorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The same four named steps AppLogo reads (`--logo-mark-*`). A raw number is
   *  not accepted: a mark's drawn size is a scale, not a per-call decision. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string; spin?: boolean;
}
export function Rotor(props: RotorProps): JSX.Element;
