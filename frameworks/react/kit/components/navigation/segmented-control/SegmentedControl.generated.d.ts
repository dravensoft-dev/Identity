import React from 'react';
import type { SegmentOption, SegmentedControlSize } from '../../../Api.generated';
export type { SegmentOption };
export interface SegmentedControlProps {
    options: SegmentOption[];
    value?: string;
    defaultValue?: string;
    size?: SegmentedControlSize;
    ariaLabel: string;
    name?: string;
    onChange?: (value: string) => void;
}
export declare function SegmentedControl({ options, value, defaultValue, onChange, size, ariaLabel, name, }: SegmentedControlProps): React.JSX.Element;
