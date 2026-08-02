import React from 'react';

import type { GridGap } from '../../../Api.generated';

export interface GridProps {

  /** The narrowest a cell may be before the count drops. It is the one number this component takes and it is page geometry rather than a step on the spacing scale, which models rhythm and not the width of a card. It is clamped against the container, so a minimum wider than the room available yields one full-width column instead of overflowing it. */
  min?: string;

  /** The air between cells, on both axes. Named steps rather than a length, because rhythm is what the spacing scale is for and a grid is where a hand-picked one shows worst. */
  gap?: GridGap;

  /** A ceiling on the grid's own width, centred in whatever contains it. Absent, it fills its container, which is what a grid nested inside a page should do; a page's own reading width is what this is for. */
  maxWidth?: string;

  /** The cells, one per child. Nothing is wrapped and nothing is measured: a child is a grid item exactly as it was written, so a card, a chart or a definition list all lay out the same way. */
  children?: React.ReactNode;
}

const GAP: Record<GridGap, string> = {
  none: 'var(--sp-0)',
  sm: 'var(--sp-3)',
  md: 'var(--sp-4)',
  lg: 'var(--sp-6)',
};

export function Grid({ min = 'calc(var(--sp-1) * 50)', gap = 'md', maxWidth, children }: GridProps) {
  return (
    <div style={{
      display: 'grid', width: '100%',
      gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`,
      gap: GAP[gap] || GAP.md,
      maxWidth, marginInline: maxWidth ? 'auto' : undefined,
    }}>
      {children}
    </div>
  );
}
