import * as React from 'react';
import type { MenuItem, MenuAlign } from '../../../Api.generated';

export type { MenuItem };

export interface MenuProps {

  trigger: React.ReactNode;

  items: MenuItem[];

  align?: MenuAlign;

  onSelect?: (item: MenuItem) => void;
}
export function Menu(props: MenuProps): JSX.Element;
