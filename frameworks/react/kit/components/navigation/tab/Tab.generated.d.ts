import React from 'react';
export interface TabInjected {
    selected: boolean;
    tabStop: boolean;
    tabId: string;
    panelId: string;
    onSelect: (value: string) => void;
}
export interface TabProps {
    value: string;
    label: string;
    children?: React.ReactNode;
}
export declare function Tab({ value, label, selected, tabStop, tabId, panelId, onSelect, }: TabProps & Partial<TabInjected>): React.JSX.Element;
