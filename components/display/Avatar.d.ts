import * as React from 'react';
/** Avatar of a person or entity (image or initials) with optional presence. */
export interface AvatarProps {
  src?: string; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded'; status?: 'online' | 'busy' | 'away' | 'offline';
  style?: React.CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;
