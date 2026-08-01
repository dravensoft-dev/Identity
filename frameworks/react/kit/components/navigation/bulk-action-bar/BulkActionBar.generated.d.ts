import React from 'react';
import type { BulkAction } from '../../../Api.generated';
export type { BulkAction };
export interface BulkActionBarProps {
    count: number;
    noun?: string;
    actions: BulkAction[];
    onRun?: (action: BulkAction) => void;
    clearable?: boolean;
    onClear?: () => void;
}
export declare function BulkActionBar({ count, noun, actions, onRun, onClear, clearable }: BulkActionBarProps): React.JSX.Element | null;
