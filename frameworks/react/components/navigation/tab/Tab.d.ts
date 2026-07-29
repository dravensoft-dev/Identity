import * as React from 'react';

export interface TabProps {

  value: string;

  label: string;

  children?: React.ReactNode;
}

export function Tab(props: TabProps): JSX.Element;
