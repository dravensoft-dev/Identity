import * as React from 'react';

export interface TabsProps {

  children?: React.ReactNode;

  value?: string;

  defaultValue?: string;

  onChange?: (value: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
