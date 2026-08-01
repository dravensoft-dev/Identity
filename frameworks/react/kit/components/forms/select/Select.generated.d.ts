import React from 'react';
import type { SelectOption } from '../../../Api.generated';
export type { SelectOption };
export interface SelectProps {
    label?: string;
    options?: SelectOption[];
    value?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    onChange?: (value: string) => void;
}
export declare function Select({ label, options, value, onChange, disabled, required, name }: SelectProps): React.JSX.Element;
