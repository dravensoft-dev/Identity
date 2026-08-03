import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './Spinner.manifest.generated.ts';

import type { ControlSize, SpinnerTone } from '../../../Api.generated';

export interface SpinnerProps {

  /** Diameter. 'sm' is --icon-sm exactly, so a spinner at that size sits inline with control text. */
  size?: ControlSize;

  /** Colour of the ring. 'on-accent' inside a filled button; 'accent' on a page surface. */
  tone?: SpinnerTone;

  /** Accessible name, announced by the status role. Say what is loading when you can. */
  label?: string;
}


const spinnerStyles = tv(manifest);

export function Spinner({ size = 'md', tone = 'accent', label = 'Loading' }: SpinnerProps) {
  const styles = spinnerStyles({ size, tone });
  return (
    <span role="progressbar" aria-live="polite" aria-label={label} className={styles.root()}>
      <span className={styles.circle()} aria-hidden="true" />
    </span>
  );
}
