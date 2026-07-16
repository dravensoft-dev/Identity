import * as React from 'react';
/** Status label (mono uppercase, short). Taxonomy of `tone` (H4):
 *  · System STATUS tones — success / warning / danger / info: reflect the actual state of
 *    an object (deploy, service, version). Don't use them for decoration.
 *  · EMPHASIS tones — accent (new/featured) and gold (priority/distinction): editorial,
 *    they don't represent status. `neutral` = no semantic weight (draft, count). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'gold' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
}
export function Badge(props: BadgeProps): JSX.Element;
