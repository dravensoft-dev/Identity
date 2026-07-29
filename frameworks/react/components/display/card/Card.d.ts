import * as React from 'react';

export interface CardProps {

  children?: React.ReactNode;
  title?: string;
  eyebrow?: string;

  action?: React.ReactNode;
  floating?: boolean;
  accent?: boolean;
}
export function Card(props: CardProps): JSX.Element;
