import * as React from 'react';

export interface TooltipProps {

  label: string;

  children: React.ReactNode;
}
export function Tooltip(props: TooltipProps): JSX.Element;
