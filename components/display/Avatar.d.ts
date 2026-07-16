import * as React from 'react';
/** Avatar de persona o entidad (imagen o iniciales) con presencia opcional. */
export interface AvatarProps {
  src?: string; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded'; status?: 'online' | 'busy' | 'away' | 'offline';
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;
