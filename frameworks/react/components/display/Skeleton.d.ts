import * as React from 'react';
/** Loading placeholder for asynchronous data (H1). Reserves the layout for the real content. */
export interface SkeletonProps {
  variant?: 'text' | 'line' | 'block' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Number of lines when variant='text'. The last one is shorter. */
  lines?: number;
  radius?: string;
  style?: React.CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
