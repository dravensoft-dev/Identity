import React from 'react';
import type { MenuItem, MenuAlign } from '../../../Api.generated';
export type { MenuItem };
export interface MenuProps {
    trigger: React.ReactNode;
    items: MenuItem[];
    align?: MenuAlign;
    onSelect?: (item: MenuItem) => void;
}
export declare function Menu({ trigger, items, align, onSelect }: MenuProps): React.JSX.Element;
