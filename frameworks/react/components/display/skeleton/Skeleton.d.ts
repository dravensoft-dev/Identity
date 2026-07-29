import type { SkeletonVariant } from '../../../Api.generated';

export interface SkeletonProps {
  variant?: SkeletonVariant;

  width?: string;

  height?: string;

  lines?: number;

  radius?: string;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
