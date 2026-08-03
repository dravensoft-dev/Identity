import React from 'react';
import { tv } from '../../../Tv.generated.ts';
import manifest from './StatCard.manifest.generated.ts';

import type { StatDelta, Tone } from '../../../Api.generated';

export type { StatDelta };

export interface StatCardProps {

  /** Short uppercase microlabel, two words at most. */
  label: string;

  /** Preformatted, e.g. "1,284" or "99.9%". StatCard never formats. */
  value: string;

  /** What state the number IS in right now, as against how it moved. Badge's vocabulary. */
  tone?: Tone;
  /** How the number moved. Absent renders no pill. */
  delta?: StatDelta;

  /** Small muted line under the value: context, e.g. "vs last week". */
  sub?: string;

  /** A Phosphor class name for a small glyph beside the label, drawn muted. Arena renders the aria-hidden wrapper and the `<i>`. */
  icon?: string;
}


const statCardStyles = tv(manifest);

export function StatCard({ label, value, tone = 'neutral', delta, sub, icon }: StatCardProps) {
  if (!label || !value) throw new Error('StatCard: `label` and `value` are required');
  const styles = statCardStyles({ tone, deltaTone: delta?.tone ?? 'neutral' });
  return (
    <div className={styles.root()}>
      <div className={styles.head()}>
        <span className={styles.label()}>{label}</span>
        {icon && <span aria-hidden="true" className={styles.icon()}><i className={icon} /></span>}
      </div>
      <div className={styles.value()}>{value}</div>
      {delta?.value && (
        <span className={styles.delta()}>
          <i className={delta.direction === 'down' ? 'ph-bold ph-arrow-down' : 'ph-bold ph-arrow-up'} aria-hidden="true" />
          {delta.value}
        </span>
      )}
      {sub && <span className={styles.sub()}>{sub}</span>}
    </div>
  );
}
