import { chartLabelGap, chartPadBottom } from '../../Tokens.generated.js';
import type { ArenaDomain, ArenaLinePoint } from './ChartScales.ts';

export function arenaPolarAngle(index: number, count: number): number {
  if (count <= 0) return -Math.PI / 2;
  return -Math.PI / 2 + (Math.PI * 2 * index) / count;
}

export function arenaPolarPoint(cx: number, cy: number, r: number, index: number, count: number): ArenaLinePoint {
  const angle = arenaPolarAngle(index, count);
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function arenaPolarIndex(cx: number, cy: number, x: number, y: number, count: number): number {
  if (count <= 0) return -1;
  const step = (Math.PI * 2) / count;
  const turn = (Math.atan2(y - cy, x - cx) + Math.PI / 2) / step;
  return ((Math.round(turn) % count) + count) % count;
}

export function arenaRadarRings(domain: ArenaDomain): number[] {
  const rings: number[] = [];
  if (domain.step <= 0) return rings;
  for (let value = domain.step; value <= domain.max + 1e-9; value += domain.step) rings.push(value);
  return rings;
}

export function arenaPolarAnchor(index: number, count: number): 'start' | 'middle' | 'end' {
  const across = Math.cos(arenaPolarAngle(index, count));
  if (Math.abs(across) < 1e-6) return 'middle';
  return across > 0 ? 'start' : 'end';
}

export function arenaRadarRadius(plotWidth: number, height: number): number {
  return Math.max(1, Math.min(plotWidth, height) / 2 - chartPadBottom);
}

export function arenaRadarLabelRadius(plotWidth: number, height: number): number {
  return arenaRadarRadius(plotWidth, height) + chartLabelGap;
}
