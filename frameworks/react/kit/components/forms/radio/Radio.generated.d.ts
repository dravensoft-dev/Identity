import React from 'react';
export interface RadioInjected {
    name: string;
    checked: boolean;
    onSelect: (value: string) => void;
}
export interface RadioProps {
    value: string;
    label?: string;
    hint?: string;
    disabled?: boolean;
}
export declare function Radio({ value, label, hint, name, checked, onSelect, disabled }: RadioProps & Partial<RadioInjected>): React.JSX.Element;
