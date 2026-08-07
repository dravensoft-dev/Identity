import { ARENA_PAD } from '../../DataVisuals.ts';
import { chartLabelGap, chartRingInset } from '../../Tokens.generated.js';
import type { ArenaLinearScale } from './ChartScales.ts';
import { arenaScaleValue } from './ChartScales.ts';

export interface ArenaPlotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ArenaAxisTick {
  value: number;
  y: number;
  label: string;
}

export function arenaPlotBox(width: number, height: number): ArenaPlotBox {
  return {
    x: ARENA_PAD.l,
    y: ARENA_PAD.t,
    w: Math.max(1, width - ARENA_PAD.l - ARENA_PAD.r),
    h: Math.max(1, height - ARENA_PAD.t - ARENA_PAD.b),
  };
}

export function arenaAxisTicks(
  scale: ArenaLinearScale, values: readonly number[], write: (value: number) => string,
): ArenaAxisTick[] {
  return values.map((value) => ({ value, y: arenaScaleValue(scale, value), label: write(value) }));
}

export function arenaTickLabelX(): number {
  return ARENA_PAD.l - chartLabelGap;
}

export function arenaCategoryLabelY(height: number): number {
  return height - chartLabelGap;
}

export function arenaDoughnutRadii(plotWidth: number, height: number): { outer: number; inner: number } {
  const outer = Math.max(1, Math.min(plotWidth, height) / 2 - chartRingInset);
  return { outer, inner: outer * 0.62 };
}
