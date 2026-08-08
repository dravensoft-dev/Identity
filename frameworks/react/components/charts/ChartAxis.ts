import { ARENA_PAD } from '../../DataVisuals.ts';
import { chartLabelGap, chartRingInset, chartPadCategory } from '../../Tokens.generated.js';
import type { ArenaChartShape } from '../../Api.generated';
import type { ArenaDomain, ArenaLinearScale } from './ChartScales.ts';
import { arenaScaleValue, arenaScaleZero, arenaDomainTicks } from './ChartScales.ts';

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

export interface ArenaAxisModel {
  ticks: ArenaAxisTick[];
  zeroY: number;
}

export interface ArenaAxisTickX {
  value: number;
  x: number;
  label: string;
}

export interface ArenaAxisModelX {
  ticks: ArenaAxisTickX[];
  zeroX: number;
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

export function arenaAxisModel(
  scale: ArenaLinearScale, domain: ArenaDomain, write: (value: number) => string,
): ArenaAxisModel {
  return {
    ticks: arenaAxisTicks(scale, arenaDomainTicks(domain), write),
    zeroY: arenaScaleZero(scale),
  };
}

export function arenaTickLabelX(): number {
  return ARENA_PAD.l - chartLabelGap;
}

export function arenaCategoryLabelY(height: number): number {
  return height - chartLabelGap;
}

export function arenaDoughnutRadii(
  plotWidth: number, height: number, shape: ArenaChartShape,
): { outer: number; inner: number } {
  const outer = Math.max(1, Math.min(plotWidth, height) / 2 - chartRingInset);
  return { outer, inner: shape === 'pie' ? 0 : outer * 0.62 };
}

export function arenaPlotBoxH(width: number, height: number): ArenaPlotBox {
  return {
    x: chartPadCategory,
    y: ARENA_PAD.t,
    w: Math.max(1, width - chartPadCategory - ARENA_PAD.r),
    h: Math.max(1, height - ARENA_PAD.t - ARENA_PAD.b),
  };
}

export function arenaAxisTicksX(
  scale: ArenaLinearScale, values: readonly number[], write: (value: number) => string,
): ArenaAxisTickX[] {
  return values.map((value) => ({ value, x: arenaScaleValue(scale, value), label: write(value) }));
}

export function arenaAxisModelX(
  scale: ArenaLinearScale, domain: ArenaDomain, write: (value: number) => string,
): ArenaAxisModelX {
  return {
    ticks: arenaAxisTicksX(scale, arenaDomainTicks(domain), write),
    zeroX: arenaScaleZero(scale),
  };
}

export function arenaCategoryLabelX(): number {
  return chartPadCategory - chartLabelGap;
}

export function arenaTickLabelY(height: number): number {
  return height - chartLabelGap;
}
