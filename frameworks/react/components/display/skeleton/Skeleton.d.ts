import type { SkeletonVariant } from '../../api.generated';
/** Loading placeholder for asynchronous data (H1). Reserves the layout for the real content. */
export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** CSS width, e.g. "100%" or "12rem". Defaults to full width. */
  width?: string;
  /** CSS height. Defaults per variant. */
  height?: string;
  /** Number of lines when variant='text'. The last one is shorter. */
  lines?: number;
  /** CSS border radius. Defaults to a small token radius. Applies only to variant="block" —
   *  circle is always a perfect circle and text/line rows are a fixed small radius. */
  radius?: string;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
