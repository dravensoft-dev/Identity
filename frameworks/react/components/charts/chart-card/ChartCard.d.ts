import * as React from 'react';

export interface ChartCardProps {

  title?: string;

  actions?: React.ReactNode;
  children?: React.ReactNode;
}
export function ChartCard(props: ChartCardProps): JSX.Element;
