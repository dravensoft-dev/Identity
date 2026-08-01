import React from 'react';
import type { ButtonType, ControlSize, IconButtonVariant } from '../../../Api.generated';
export interface IconButtonProps {
    icon: string;
    label: string;
    size?: ControlSize;
    variant?: IconButtonVariant;
    showLabel?: boolean;
    disabled?: boolean;
    type?: ButtonType;
    name?: string;
    value?: string;
    autoFocus?: boolean;
    form?: string;
    tabStop?: boolean;
    onClick?: () => void;
}
export declare function IconButton({ icon, label, size, variant, showLabel, disabled, type, name, value, autoFocus, form, onClick, tabStop, }: IconButtonProps): React.JSX.Element;
