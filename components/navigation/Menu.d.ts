import * as React from 'react';
export interface MenuItemDef {
  label?: string; icon?: React.ReactNode; onClick?: () => void; shortcut?: string;
  destructive?: boolean; disabled?: boolean; divider?: boolean; header?: string;
}
/** Dropdown menu for actions / overflow. */
export interface MenuProps {
  trigger: React.ReactNode; items: MenuItemDef[]; align?: 'start' | 'end'; style?: React.CSSProperties;
}
export function Menu(props: MenuProps): JSX.Element;
