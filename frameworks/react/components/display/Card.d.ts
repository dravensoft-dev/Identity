import * as React from 'react';
/** Surface container. Hairline border; `floating` adds shadow; `accent` crimson border.
 * @startingPoint section="Display" subtitle="Surface card with header" viewport="700x220" */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string; eyebrow?: string; action?: React.ReactNode;
  floating?: boolean; accent?: boolean;
}
export function Card(props: CardProps): JSX.Element;
