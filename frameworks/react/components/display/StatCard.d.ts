import * as React from 'react';
import type { StatDelta, Tone } from '../../api.generated';

export type { StatDelta };

export interface StatCardProps {
  /** Short uppercase microlabel (<= 2 words). */
  label: string;
  /** Preformatted, e.g. "1,284" or "99.9%". */
  value: string;
  /**
   * @startingPoint Leave it off. Color the value only when the number's
   * current STATE carries meaning a reader would otherwise miss.
   *
   * Distinct from `delta.tone`, which reports whether the number *moved*
   * well. This reports what it *is*: 99.98% uptime is `success` whether or
   * not it improved; two open incidents are `danger` even when that is down
   * from five. Vocabulary is Badge's, so one set of tone names covers both.
   */
  tone?: Tone;
  delta?: StatDelta;
  /** Small muted line under the value — context, e.g. "vs last week". */
  sub?: string;
  /** @startingPoint A Phosphor class name (e.g. "ph-bold ph-timer") for a
   * small glyph beside the label; rendered muted at .6 opacity. Arena draws
   * the `<i>` and its aria-hidden wrapper — absent renders neither. */
  icon?: string;
}
export function StatCard(props: StatCardProps): JSX.Element;
