import * as React from 'react';
import type { Tone } from '../../api.generated';

/** Status label (mono uppercase, short). Taxonomy of `tone` (H4):
 *  · System STATUS tones — success / warning / danger / info: reflect the actual state of
 *    an object (deploy, service, version). Don't use them for decoration.
 *  · EMPHASIS tones — accent (new/featured) and gold (priority/distinction): editorial,
 *    they don't represent status. `neutral` = no semantic weight (draft, count). */
export interface BadgeProps {
  /** The label text. Short — a badge is a chip, not a sentence. */
  children?: React.ReactNode;
  tone?: Tone;
  /** Draws a filled dot in the tone colour before the label. */
  dot?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
