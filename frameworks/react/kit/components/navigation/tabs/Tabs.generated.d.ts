import React from 'react';
export interface TabsProps {
    children?: React.ReactNode;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
}
export declare function Tabs({ children, value, defaultValue, onChange }: TabsProps): React.JSX.Element;
