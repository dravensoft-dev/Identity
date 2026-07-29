import * as React from 'react';
/**
 * A short label revealed on pointer intent. Bone over dark for contrast. It
 * waits `--delay-open` before appearing and `--delay-close` before withdrawing,
 * so a pointer crossing a toolbar reveals nothing. Both delays are pointer
 * intent; there is no keyboard trigger yet.
 */
export interface TooltipProps {
  /** The bubble's text. Arena draws the bubble; the consumer names it. */
  label: string;
  /** The element the tooltip describes and attaches to. */
  children: React.ReactNode;
}
export function Tooltip(props: TooltipProps): JSX.Element;
