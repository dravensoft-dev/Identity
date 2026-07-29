export interface SideNavItemProps {

  id: string;

  label: string;

  icon?: string;

  href?: string;
}

export function SideNavItem(props: SideNavItemProps): JSX.Element;
