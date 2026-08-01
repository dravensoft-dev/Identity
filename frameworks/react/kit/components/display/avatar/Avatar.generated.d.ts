import React from 'react';
import type { AvatarSize, AvatarShape, AvatarStatus } from '../../../Api.generated';
export interface AvatarProps {
    src?: string;
    name?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    status?: AvatarStatus;
}
export declare function Avatar({ src, name, size, shape, status }: AvatarProps): React.JSX.Element;
