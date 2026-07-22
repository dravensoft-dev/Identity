/* Shared internals for Arena's chart family. NOT a component — no quartet.
 *
 * Why hand-written SVG and not Chart.js: a <canvas> cannot inherit CSS, and
 * that inability is the ONLY reason a "chart palette" contract would need to
 * exist. An <svg> reads var(--color-cat-N) directly and re-themes with no code
 * at all, and it costs zero dependencies — which matters for a copy-in kit
 * that has no package.json to add a peer to. The price is that the tooltip,
 * the legend and the axes are ours to write. They are.
 */

import {
  chartHeight, chartPadTop, chartPadRight, chartPadBottom, chartPadLeft,
} from '../../tokens.generated.js';

export const CAT_SLOTS = 8;

/* CHART_HEIGHT and PAD keep their names and shapes -- the call sites read
 * PAD.l, and renaming them would be churn on top of a relocation. What changed
 * is where the numbers come from: tokens/src/chart.json, via the generated
 * module. Do not reintroduce a literal here; check-script-tokens.mjs asserts
 * the token and the custom property agree, and a literal is outside that. */
export const CHART_HEIGHT = chartHeight;
export const PAD = { t: chartPadTop, r: chartPadRight, b: chartPadBottom, l: chartPadLeft };

/** Identity color for slot N (1-based, clamped to the ramp).
 *  Slots are assigned IN ORDER and NEVER cycled: a 9th series folds to
 *  "Other", small multiples, or direct labels. Wrapping back to slot 1 would
 *  silently claim two different series are the same one. */
export function catColor(slot) {
  const n = Math.min(CAT_SLOTS, Math.max(1, Math.round(slot) || 1));
  return `var(--color-cat-${n})`;
}

const TONE_VARS = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};
/** Semantic color, for when a series IS a state. */
export const toneColor = (tone) => TONE_VARS[tone];

const warned = new Set();
function warnOnce(message) {
  if (warned.has(message) || typeof console === 'undefined') return;
  warned.add(message);
  console.warn('[arena] ' + message);
}

/**
 * The color contract, made enforceable.
 * Identity (slot/slots) and meaning (tone) are never both in one chart: a
 * series painted --danger reads as an error, so mixing the two makes the
 * chart lie. Passing both warns at development time and `tone` wins.
 */
export function resolveColors({ slot, slots, tone, count }) {
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

/** Round a max up to a readable axis top (1, 2, 2.5, 5 or 10 × a power of ten). */
export function niceMax(max) {
  if (!(max > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(max)));
  const norm = max / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export function ticks(max, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** A bar: rounded at the DATA END only, square where it meets the baseline.
 *  A plain rect with rx would round all four corners and lift the bar off its
 *  own axis, which misreads the value. Degrades cleanly when h < r. */
export function barPath(x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y}`
    + ` L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/** A doughnut segment between two angles (radians, 0 = 3 o'clock). */
export function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  // A single 100% slice would start and end on the same point, which collapses
  // the arc to nothing. Draw it as two halves instead.
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    return arcPath(cx, cy, rOuter, rInner, a0, mid) + ' ' + arcPath(cx, cy, rOuter, rInner, mid, a1);
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = pt(rOuter, a0);
  const [x1, y1] = pt(rOuter, a1);
  const [x2, y2] = pt(rInner, a1);
  const [x3, y3] = pt(rInner, a0);
  return `M${x0},${y0} A${rOuter},${rOuter} 0 ${large} 1 ${x1},${y1}`
    + ` L${x2},${y2} A${rInner},${rInner} 0 ${large} 0 ${x3},${y3} Z`;
}

/** Visually hidden, still read aloud. Every chart pairs role="img" with a real
 *  <table> of its numbers: a picture no one can read is not an alternative. */
export const srOnly = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};
