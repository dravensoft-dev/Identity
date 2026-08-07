import {
  chartHeight, chartPadTop, chartPadRight, chartPadBottom, chartPadLeft, catSlots,
  tintArea, tintSoft, tintEdge,
} from './Tokens.generated';
import type { ArenaNumberFormat, ArenaSeriesTone, ArenaTone } from './Api.generated';
import { arenaWarnOnce } from './WarnOnce';

export const ARENA_CAT_SLOTS = catSlots;

export const ARENA_CHART_HEIGHT = chartHeight;

export const ARENA_PAD = {
  t: chartPadTop, r: chartPadRight, b: chartPadBottom, l: chartPadLeft,
} as const;

export const ARENA_SR_ONLY = {
  position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px',
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: '0',
} as const satisfies Readonly<Record<string, string>>;

export function arenaCatColor(slot: number): string {
  const n = Math.min(ARENA_CAT_SLOTS, Math.max(1, Math.round(slot) || 1));
  return `var(--color-cat-${n})`;
}

export function arenaCatSlotFor(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return (hash % ARENA_CAT_SLOTS) + 1;
}

export interface ArenaCatSurface {
  fill: string;
  border: string;
}

export function arenaCatSurface(slot: number): ArenaCatSurface {
  const colour = arenaCatColor(slot);
  return {
    fill: `color-mix(in oklab, ${colour} ${tintSoft}%, var(--color-base-100))`,
    border: `color-mix(in oklab, ${colour} ${tintEdge}%, transparent)`,
  };
}

export function arenaAreaFill(colour: string): string {
  return `color-mix(in oklab, ${colour} ${tintArea}%, transparent)`;
}

const TONE_VARS: Record<ArenaTone, string> = {
  neutral: 'var(--text-body)',
  accent: 'var(--accent)',
  gold: 'var(--gold)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

export function arenaToneColor(tone: ArenaTone): string {
  return TONE_VARS[tone];
}

export function arenaResolveColors(options: {
  slot?: number;
  slots?: readonly number[];
  tone?: ArenaSeriesTone;
  count: number;
}): string[] {
  const { slot, slots, tone, count } = options;
  if (tone && (slot !== undefined || slots !== undefined)) {
    arenaWarnOnce('chart: `tone` and `slot`/`slots` are mutually exclusive — a chart carries identity or meaning, never both. `tone` wins; remove the other.');
  }
  if (tone) {
    const colour = arenaToneColor(tone) || arenaCatColor(1);
    return Array.from({ length: count }, () => colour);
  }
  if (slots) return Array.from({ length: count }, (_, i) => arenaCatColor(slots[i] ?? i + 1));
  return Array.from({ length: count }, () => arenaCatColor(slot ?? 1));
}

export interface ArenaValueWriterOptions {
  prefix?: string;
  suffix?: string;
  format?: ArenaNumberFormat;
}

export function arenaValueWriter({ prefix, suffix, format }: ArenaValueWriterOptions): (value: number) => string {
  const head = prefix ?? '';
  const tail = suffix ?? '';
  if (!format) return (value) => `${head}${value}${tail}`;

  const options: Intl.NumberFormatOptions = {};
  if (format.fractionDigits !== undefined) {
    options.minimumFractionDigits = format.fractionDigits;
    options.maximumFractionDigits = format.fractionDigits;
  }
  if (format.grouping === false) options.useGrouping = false;
  if (format.compact) options.notation = 'compact';

  let intl: Intl.NumberFormat | null = null;
  try {
    intl = new Intl.NumberFormat(format.locale, options);
  } catch {
    arenaWarnOnce(`chart: valueFormat.locale "${format.locale}" is not a tag Intl accepts, so every number`
      + ' the chart writes falls back to the raw JavaScript one. A tick, a tooltip and the accessible'
      + ' table all read differently from the table beside them until it is a BCP-47 tag.');
  }
  return (value) => `${head}${intl ? intl.format(value) : value}${tail}`;
}

export function arenaPlotWidth(available: number, count: number, minPointSpacing: number | undefined): number {
  if (!minPointSpacing || !(minPointSpacing > 0) || count < 2) return available;
  const needed = ARENA_PAD.l + ARENA_PAD.r + minPointSpacing * (count - 1);
  return Math.max(available, needed);
}
export const ARENA_RAIL_STYLE = {
  overflowX: 'auto', overflowY: 'hidden', display: 'block',
} as const satisfies Readonly<Record<string, string>>;

export function arenaNiceMax(max: number): number {
  if (!(max > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export function arenaTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

export function arenaBarPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y}`
    + ` L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export function arenaArcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return `${arenaArcPath(cx, cy, rOuter, rInner, a0, mid)} ${arenaArcPath(cx, cy, rOuter, rInner, mid, a1)}`;
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
