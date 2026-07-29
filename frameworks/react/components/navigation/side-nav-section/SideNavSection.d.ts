import * as React from 'react';

export interface SideNavSectionProps {

  label: string;

  children: React.ReactNode;
}

export function SideNavSection(props: SideNavSectionProps): JSX.Element;
