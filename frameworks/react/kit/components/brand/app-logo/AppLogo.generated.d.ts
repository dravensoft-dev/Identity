import React from 'react';
import type { LogoSize, Orientation } from '../../../Api.generated';
export interface AppLogoProps {
    size?: LogoSize;
    orientation?: Orientation;
    mark: React.ReactNode;
    name: string;
    dim?: string;
}
export declare function AppLogo({ size, orientation, mark, name, dim }: AppLogoProps): React.JSX.Element;
