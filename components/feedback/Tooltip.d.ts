import * as React from 'react';
/** Tooltip on hover. Bone background over dark for contrast. */
export interface TooltipProps {
  content: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}
export function Tooltip(props: TooltipProps): JSX.Element;
