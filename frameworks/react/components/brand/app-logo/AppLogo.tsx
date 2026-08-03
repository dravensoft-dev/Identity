import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './AppLogo.manifest.generated.ts';

import type { LogoSize, Orientation } from '../../../Api.generated';

export interface AppLogoProps {

  /** Both halves at once: the mark's slot and the wordmark. */
  size?: LogoSize;
  /** Mark beside the name, or above it. */
  orientation?: Orientation;

  /** The mark, as an asset the consumer supplies. Required: Arena ships MIT and a default would ship Dravensoft's trademark to whoever never read the API. The slot sizes the mark; a mark that brings its own dimensions fights the lock-up. */
  mark: React.ReactNode;

  /** The product name, or its first half when `dim` carries the second. */
  name: string;

  /** The wordmark's second half, drawn muted. Present for the manual's Primary variant, absent for Monochrome, which is why there is no `variant` member: the mark's ink and this are the same two decisions. */
  dim?: string;
}


const logoStyles = tv(manifest);

export function AppLogo({ size = 'md', orientation = 'horizontal', mark, name, dim }: AppLogoProps) {
  if (!mark || !name) throw new Error('AppLogo: `mark` and `name` are required');
  const styles = logoStyles({ size, orientation });
  return (
    <span className={styles.root()}>
      <span className={styles.mark()}>{mark}</span>
      <span className={styles.name()}>
        {name}{dim && <span className={styles.dim()}>{dim}</span>}
      </span>
    </span>
  );
}
