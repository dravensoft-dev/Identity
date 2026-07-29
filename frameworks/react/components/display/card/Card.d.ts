import * as React from 'react';

/** Surface container. Hairline border; `floating` adds shadow; `accent` crimson border.
 * @startingPoint section="Display" subtitle="Surface card with header" viewport="700x220" */
export interface CardProps {
  /** The card's body, below the optional header. */
  children?: React.ReactNode;
  title?: string;
  eyebrow?: string;
  /** Right-aligned in the header, beside the title. */
  action?: React.ReactNode;
  floating?: boolean;
  accent?: boolean;
}
export function Card(props: CardProps): JSX.Element;
