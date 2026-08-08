import { chartLegendMin, chartLegendMax, chartLegendGap, chartLegendStrip } from '../../Tokens.generated.js';
import type { ArenaChartLegendLayout } from '../../Api.generated';

export interface ArenaLegendStrip {
  plotH: number;
  stripH: number;
}

export function arenaLegendColumnWidth(width: number): number {
  return Math.min(chartLegendMax, Math.max(chartLegendMin, width * 0.34));
}

export function arenaLegendPlotWidth(width: number): number {
  return Math.max(1, width - arenaLegendColumnWidth(width) - chartLegendGap);
}

export function arenaLegendStacked(layout: ArenaChartLegendLayout, width: number): boolean {
  if (layout !== 'auto') return layout === 'stacked';
  return arenaLegendColumnWidth(width) < chartLegendMax;
}

export function arenaLegendShows(seriesCount: number): boolean {
  return seriesCount > 1;
}

export function arenaLegendStrip(height: number, seriesCount: number): ArenaLegendStrip {
  const stripH = arenaLegendShows(seriesCount) ? chartLegendStrip : 0;
  return { plotH: Math.max(1, height - stripH), stripH };
}
