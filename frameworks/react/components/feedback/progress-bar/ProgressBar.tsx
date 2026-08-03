import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './ProgressBar.manifest.generated.ts';

import type { ControlSize, ProgressTone } from '../../../Api.generated';

export interface ProgressBarProps {

  /** How far along, 0-100. Clamped and rounded. Ignored when `indeterminate`. */
  progressPercentage?: number;

  /** A wait with no percentage; the bar sweeps instead of filling. */
  indeterminate?: boolean;

  /** The bar's colour. */
  tone?: ProgressTone;

  /** Names what is progressing. Drawn above the bar, and it is the bar's accessible name. Required and guarded rather than defaulted: nothing can derive what is progressing, and a fallback of "Progress" satisfies roles.label mechanically while telling a screen-reader user only what the component is -- two of them on one page announce identically. */
  label: string;

  /** Shows the percentage beside the label. Determinate only. */
  showPercentage?: boolean;

  /** The bar's thickness. */
  size?: ControlSize;
}


const progressStyles = tv(manifest);

export function ProgressBar({ progressPercentage = 0, indeterminate = false, tone = 'accent', label, showPercentage = true, size = 'md' }: ProgressBarProps) {
  if (!label) throw new Error('ProgressBar: `label` is required (it names what is progressing, and nothing can derive that)');
  const styles = progressStyles({ tone, size });
  const pct = Math.max(0, Math.min(100, Math.round(progressPercentage)));
  return (
    <div className={styles.root()}>
      <div className={styles.head()}>
        <span className={styles.label()}>{label}</span>
        {showPercentage && !indeterminate && <span className={styles.value()}>{pct}%</span>}
      </div>
      <div role="progressbar" aria-live="polite" aria-valuenow={indeterminate ? undefined : pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
        className={indeterminate ? `${styles.track()} ${styles.indeterminate()}` : styles.track()}>
        {!indeterminate && (
          <>
            <span className={styles.announcement()}>{pct}%</span>
            <span className={styles.fill()} style={{ width: `${pct}%` }} />
          </>
        )}
      </div>
    </div>
  );
}
