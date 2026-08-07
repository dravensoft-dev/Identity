import { chartLegendMin, chartLegendMax, chartLegendGap } from '../../Tokens.generated.js';
import type { ArenaChartLegendLayout } from '../../Api.generated';

export function arenaLegendWidth(width: number): number {
  return Math.min(chartLegendMax, Math.max(chartLegendMin, width * 0.34));
}

export function arenaLegendPlotWidth(width: number): number {
  return Math.max(1, width - arenaLegendWidth(width) - chartLegendGap);
}

export function arenaLegendStacked(layout: ArenaChartLegendLayout, width: number): boolean {
  if (layout !== 'auto') return layout === 'stacked';
  return arenaLegendWidth(width) < chartLegendMax;
}
