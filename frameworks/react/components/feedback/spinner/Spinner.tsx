import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Spinner.classes.generated.ts';

import type { ArenaControlSize, ArenaSpinnerTone } from '../../../Api.generated';

export interface SpinnerProps {

  /** Diameter. 'sm' is --icon-sm exactly, so a spinner at that size sits inline with control text. */
  size?: ArenaControlSize;

  /** Colour of the ring. 'on-accent' inside a filled button; 'accent' on a page surface. */
  tone?: ArenaSpinnerTone;

  /** Accessible name, announced by the status role. Say what is loading when you can. */
  label?: string;
}


const spinnerStyles = arenaStyles(manifest);

export function Spinner({ size = 'md', tone = 'accent', label = 'Loading' }: SpinnerProps) {
  const styles = spinnerStyles({ size, tone });
  return (
    <span role="progressbar" aria-live="polite" aria-label={label} className={styles.root()}>
      <span className={styles.circle()} aria-hidden="true" />
    </span>
  );
}
