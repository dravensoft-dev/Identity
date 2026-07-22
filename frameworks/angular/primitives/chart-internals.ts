/* Shared internals for Arena's chart family — the Angular port of
 * frameworks/react/components/charts/chart-internals.js. NOT a component: no quartet,
 * no manifest, no selector.
 *
 * Why hand-written SVG and not a charting library: a <canvas> cannot inherit CSS, and
 * that inability is the ONLY reason a "chart palette" contract would need to exist. An
 * <svg> reads var(--color-cat-N) directly and re-themes with no code at all, and it
 * costs zero dependencies. The price is that the tooltip, the legend and the axes are
 * ours to write.
 */

/** A series that IS a state rather than an identity. */
export type ArenaChartTone = 'success' | 'warning' | 'danger' | 'info';

/** How many identity slots the categorical ramp defines. Assigned in order, never cycled. */
export const CAT_SLOTS = 8;

/** The chart plot's height in px, before padding. */
export const CHART_HEIGHT = 280;

/** Plot padding in px. Left pad holds the value labels; bottom pad holds the category labels. */
export const PAD = { t: 8, r: 8, b: 28, l: 44 } as const;

/** Visually hidden, still read aloud. Every chart pairs role="img" with a real <table>
 *  of its numbers: a picture no one can read is not an alternative. Bind it with
 *  `[style]="SR_ONLY"`. Values carry their units because Angular's style binding, unlike
 *  React's, never appends one — a bare `1` would be dropped as an invalid length. */
export const SR_ONLY = {
  position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px',
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: '0',
} as const satisfies Readonly<Record<string, string>>;

/** Identity colour for slot N (1-based, clamped to the ramp). Slots are assigned IN
 *  ORDER and NEVER cycled: a 9th series folds to "Other", small multiples, or direct
 *  labels. Wrapping back to slot 1 would silently claim two different series are the
 *  same one.
 *  @param slot the 1-based ramp slot @returns a `var(--color-cat-N)` reference */
export function catColor(slot: number): string {
  const n = Math.min(CAT_SLOTS, Math.max(1, Math.round(slot) || 1));
  return `var(--color-cat-${n})`;
}

const TONE_VARS: Record<ArenaChartTone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

/** Semantic colour, for when a series IS a state.
 *  @param tone the state the series reports @returns the matching token reference */
export function toneColor(tone: ArenaChartTone): string {
  return TONE_VARS[tone];
}

const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message) || typeof console === 'undefined') return;
  warned.add(message);
  console.warn(`[arena] ${message}`);
}

/** The colour contract, made enforceable. Identity (slot/slots) and meaning (tone) are
 *  never both in one chart: a series painted --danger reads as an error, so mixing the
 *  two makes the chart lie. Passing both warns at development time and `tone` wins.
 *  The `|| catColor(1)` fallback is not dead code: `tone` arrives from a template binding
 *  or from parsed JSON, so a value outside the union is a real runtime possibility that
 *  the type alone does not prevent.
 *  @param options the series count plus at most one of `tone`, `slot`, `slots`
 *  @returns exactly `count` colour references, one per series */
export function resolveColors(options: {
  slot?: number;
  slots?: number[];
  tone?: ArenaChartTone;
  count: number;
}): string[] {
  const { slot, slots, tone, count } = options;
  if (tone && (slot !== undefined || slots !== undefined)) {
    warnOnce('chart: `tone` and `slot`/`slots` are mutually exclusive — a chart carries identity or meaning, never both. `tone` wins; remove the other.');
  }
  if (tone) {
    const colour = toneColor(tone) || catColor(1);
    return Array.from({ length: count }, () => colour);
  }
  if (slots) return Array.from({ length: count }, (_, i) => catColor(slots[i] ?? i + 1));
  return Array.from({ length: count }, () => catColor(slot ?? 1));
}

/** Round a max up to a readable axis top (1, 2, 2.5, 5 or 10 × a power of ten).
 *  @param max the largest value the axis must hold @returns the axis top, always > 0 */
export function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/** Evenly spaced axis values from 0 to `max` inclusive.
 *  @param max the axis top @param count how many intervals @returns `count + 1` values */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** A bar: rounded at the DATA END only, square where it meets the baseline. A plain rect
 *  with rx would round all four corners and lift the bar off its own axis, which
 *  misreads the value. Degrades cleanly when h < r.
 *  @param x left edge @param y data end @param w width @param h height
 *  @param r corner radius at the data end @returns an SVG path `d` */
export function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y}`
    + ` L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/** A doughnut segment between two angles (radians, 0 = 3 o'clock). A single 100% slice
 *  would start and end on the same point, which collapses the arc to nothing, so it is
 *  drawn as two halves instead.
 *  @param cx centre x @param cy centre y @param rOuter outer radius @param rInner inner
 *  radius @param a0 start angle @param a1 end angle @returns an SVG path `d` */
export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return `${arcPath(cx, cy, rOuter, rInner, a0, mid)} ${arcPath(cx, cy, rOuter, rInner, mid, a1)}`;
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
