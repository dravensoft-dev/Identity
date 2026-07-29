import * as React from 'react';

export interface SideNavProps {

  children?: React.ReactNode;

  active?: string;

  ariaLabel: string;

  indentStep?: number;

  onNav?: (id: string) => void;
}
export function SideNav(props: SideNavProps): JSX.Element;
