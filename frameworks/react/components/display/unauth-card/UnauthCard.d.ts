import * as React from 'react';

export interface UnauthCardProps {

  brand?: React.ReactNode;

  eyebrow?: string;

  title?: string;

  footer?: React.ReactNode;

  children?: React.ReactNode;
}
export function UnauthCard(props: UnauthCardProps): JSX.Element;
