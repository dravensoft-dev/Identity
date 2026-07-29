import * as React from 'react';

export interface SideNavCollapsibleProps {

  id: string;

  label: string;

  icon?: string;

  defaultExpanded?: boolean;

  children?: React.ReactNode;

  onToggle?: (expanded: boolean) => void;
}

export function SideNavCollapsible(props: SideNavCollapsibleProps): JSX.Element;
