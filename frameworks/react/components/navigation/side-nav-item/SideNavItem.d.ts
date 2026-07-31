export interface SideNavItemProps {

  id: string;

  label: string;

  icon?: string;

  href?: string;

  disabled?: boolean;
}

export function SideNavItem(props: SideNavItemProps): JSX.Element;
