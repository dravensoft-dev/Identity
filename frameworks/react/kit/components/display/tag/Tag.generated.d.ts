import React from 'react';
import type { TagTone } from '../../../Api.generated';
export interface TagProps {
    children?: React.ReactNode;
    tone?: TagTone;
    removable?: boolean;
    disabled?: boolean;
    onRemove?: () => void;
}
export declare function Tag({ children, tone, removable, disabled, onRemove }: TagProps): React.JSX.Element;
