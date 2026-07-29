import type { AvatarSize, AvatarShape, AvatarStatus } from '../../../Api.generated';

export interface AvatarProps {
  src?: string; name?: string; size?: AvatarSize;
  shape?: AvatarShape; status?: AvatarStatus;
}
export function Avatar(props: AvatarProps): JSX.Element;
