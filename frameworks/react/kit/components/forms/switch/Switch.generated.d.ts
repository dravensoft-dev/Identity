import React from 'react';
import type { Orientation, SwitchSize } from '../../../Api.generated';
export interface SwitchProps {
    state?: boolean;
    orientation?: Orientation;
    size?: SwitchSize;
    iconOn?: string;
    iconOff?: string;
    label: string;
    disabled?: boolean;
    confirm?: boolean;
    onFuncOn?: () => void;
    onFuncOff?: () => void;
    onRequestChange?: () => void;
}
export declare function Switch({ state, orientation, size, iconOn, iconOff, label, disabled, confirm, onFuncOn, onFuncOff, onRequestChange, }: SwitchProps): React.JSX.Element;
