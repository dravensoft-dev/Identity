import React from 'react';
import type { SkeletonVariant } from '../../../Api.generated';
export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string;
    height?: string;
    lines?: number;
    radius?: string;
}
export declare function Skeleton({ variant, width, height, lines, radius }: SkeletonProps): React.JSX.Element;
