import React from 'react';
export interface RadioGroupProps {
    ariaLabel: string;
    children?: React.ReactNode;
    value?: string;
    name?: string;
    onChange?: (value: string) => void;
}
export declare function RadioGroup({ value, onChange, name, ariaLabel, children }: RadioGroupProps): React.JSX.Element;
