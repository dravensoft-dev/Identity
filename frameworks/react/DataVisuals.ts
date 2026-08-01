import type * as React from 'react';
import type { SeriesTone } from './Api.generated';
import {
  chartHeight, chartPadTop, chartPadRight, chartPadBottom, chartPadLeft, catSlots,
} from './Tokens.generated.js';

export const CAT_SLOTS = catSlots;

export const CHART_HEIGHT = chartHeight;
export const PAD = { t: chartPadTop, r: chartPadRight, b: chartPadBottom, l: chartPadLeft };

export function catColor(slot: number): string {
  const n = Math.min(CAT_SLOTS, Math.max(1, Math.round(slot) || 1));
  return `var(--color-cat-${n})`;
}

const TONE_VARS: Record<SeriesTone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

export const toneColor = (tone: SeriesTone): string | undefined => TONE_VARS[tone];

const warned = new Set();
function warnOnce(message: string): void {
  if (warned.has(message) || typeof console === 'undefined') return;
  warned.add(message);
  console.warn('[arena] ' + message);
}

export interface ResolveColorsOptions {
  slot?: number;
  slots?: number[];
  tone?: SeriesTone;
  count: number;
}

export function resolveColors({ slot, slots, tone, count }: ResolveColorsOptions): string[] {
  if (tone && (slot !== undefined || slots !== undefined)) {
    warnOnce('chart: `tone` and `slot`/`slots` are mutually exclusive — a chart carries identity or meaning, never both. `tone` wins; remove the other.');
  }
  if (tone) {
    const c = toneColor(tone) || catColor(1);
    return Array.from({ length: count }, () => c);
  }
  if (slots) return Array.from({ length: count }, (_, i) => catColor(slots[i] ?? i + 1));
  return Array.from({ length: count }, () => catColor(slot ?? 1));
}

export function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

export function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y}`
    + ` L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {

  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return arcPath(cx, cy, rOuter, rInner, a0, mid) + ' ' + arcPath(cx, cy, rOuter, rInner, mid, a1);
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const pt = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = pt(rOuter, a0);
  const [x1, y1] = pt(rOuter, a1);
  const [x2, y2] = pt(rInner, a1);
  const [x3, y3] = pt(rInner, a0);
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1}`
    + ` L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}

export const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
