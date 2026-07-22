import * as React from 'react';
/**
 * Tooltip on hover. Bone background over dark for contrast. It waits
 * `--delay-open` before appearing and `--delay-close` before withdrawing, so
 * a pointer crossing a toolbar reveals nothing. Both delays are pointer
 * intent; there is no keyboard trigger yet.
 */
export interface TooltipProps {
  content: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}
export function Tooltip(props: TooltipProps): JSX.Element;
