import React from 'react';
import type { ButtonType, ButtonVariant, ControlSize } from '../../../Api.generated';
export interface ButtonProps {
    children?: React.ReactNode;
    variant?: ButtonVariant;
    size?: ControlSize;
    icon?: string;
    iconRight?: string;
    loading?: boolean;
    full?: boolean;
    disabled?: boolean;
    type?: ButtonType;
    name?: string;
    value?: string;
    autoFocus?: boolean;
    form?: string;
    tabStop?: boolean;
    onClick?: () => void;
}
export declare function Button({ children, variant, size, icon, iconRight, disabled, loading, full, type, name, value, autoFocus, form, onClick, tabStop, }: ButtonProps): React.JSX.Element;
