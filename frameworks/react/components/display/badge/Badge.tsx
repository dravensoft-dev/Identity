import React from 'react';
import { arenaStyles } from '../../../ArenaStyles.generated.ts';
import manifest from './Badge.classes.generated.ts';

import type { ArenaTone } from '../../../Api.generated';

export interface BadgeProps {

  /** The label text. Short: a badge is a chip, not a sentence. */
  children?: React.ReactNode;
  /** System status (success/warning/danger/info) reflects an object's actual state; emphasis (accent, gold) is editorial; neutral carries no semantic weight. */
  tone?: ArenaTone;

  /** Draws a filled dot in the tone colour before the label. */
  dot?: boolean;
}

const badgeStyles = arenaStyles(manifest);
const TONES = Object.keys(manifest.variants.tone);
const toneOf = (tone: string | undefined): ArenaTone | undefined =>
  (tone && TONES.includes(tone) ? tone as ArenaTone : 'neutral');

export function Badge({ children, tone = 'neutral', dot = false }: BadgeProps) {
  const styles = badgeStyles({ tone: toneOf(tone) });
  return (
    <span className={styles.root()}>
      {dot && <span className={styles.dot()} />}
      {children}
    </span>
  );
}
