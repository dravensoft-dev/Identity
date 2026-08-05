import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Skeleton.classes.generated.ts';

import type { ArenaSkeletonVariant } from '../../../Api.generated';

export interface SkeletonProps {
  /** The shape the placeholder reserves. */
  variant?: ArenaSkeletonVariant;

  /** CSS width, e.g. "100%" or "12rem". Defaults to full width. */
  width?: string;

  /** CSS height. Defaults per variant. For the `circle` variant a single diameter is what is wanted, so `height` wins over `width` when both are set. */
  height?: string;

  /** Number of rows when variant="text". The last runs short. */
  lines?: number;

  /** CSS border radius. Defaults to a small token radius. */
  radius?: string;
}


const skeletonStyles = arenaStyles(manifest);

export function Skeleton({ variant = 'block', width, height, lines = 3, radius }: SkeletonProps) {
  const styles = skeletonStyles({ variant });
  if (variant === 'text' && lines > 1) {
    return (
      <div role="status" aria-label="Loading" className={styles.stack()} style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={i === lines - 1 ? styles.lastLine() : styles.line()} />
        ))}
      </div>
    );
  }
  const box = variant === 'circle' ? (height || width) : undefined;
  return (
    <div className={styles.root()} role="status" aria-label="Loading"
      style={{ width: box ?? width, height: box ?? height, borderRadius: radius }} />
  );
}
