import type { AvatarSize, AvatarShape, AvatarStatus } from '../../api.generated';
/** Avatar of a person or entity (image or initials) with optional presence. */
export interface AvatarProps {
  src?: string; name?: string; size?: AvatarSize;
  shape?: AvatarShape; status?: AvatarStatus;
}
export function Avatar(props: AvatarProps): JSX.Element;
