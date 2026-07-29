import * as React from 'react';
import type { LogoSize, Orientation } from '../../../Api.generated';

export interface AppLogoProps {

  size?: LogoSize;
  orientation?: Orientation;

  mark: React.ReactNode;

  name: string;

  dim?: string;
}
export function AppLogo(props: AppLogoProps): JSX.Element | null;
