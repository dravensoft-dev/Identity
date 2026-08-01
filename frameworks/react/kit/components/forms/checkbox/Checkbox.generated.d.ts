import React from 'react';
export interface CheckboxProps {
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    onChange?: (checked: boolean) => void;
}
export declare function Checkbox({ checked, onChange, label, disabled, required, name, value }: CheckboxProps): React.JSX.Element;
