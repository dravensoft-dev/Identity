export interface ArenaTooltipAnchor {
  left: number;
  top: string;
}

export function arenaTooltipAnchor(x: number, y: number): ArenaTooltipAnchor {
  return { left: x, top: `calc(${y}px - var(--chart-tooltip-offset))` };
}
