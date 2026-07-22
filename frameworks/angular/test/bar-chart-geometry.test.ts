/* BarChart's geometry, extracted from the component so it can be asserted against
 * real numbers. The component's own `computed()` fields read signal inputs, and a
 * signal input cannot be driven under this harness -- it runs bun's TypeScript
 * stripping plus `@angular/compiler`'s template JIT and never `ngtsc`, so
 * `[values]="..."` fails NG0303 and a literal attribute is a silent no-op (see
 * host-class-binding.test.ts's header). `barValueY` and `barColumns` are therefore
 * plain exported functions that the component composes, the same resolution
 * confirm-dialog.ts took for its focus helpers, and they are what carries the
 * geometry this file needs to pin.
 *
 * chart-internals.test.ts already covers barPath, niceMax, ticks and resolveColors;
 * none of that is repeated here. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PAD } from '../primitives/chart-internals';
import { barValueY, barColumns } from '../primitives/bar-chart/bar-chart';

const IH = 244; // CHART_HEIGHT (280) - PAD.t (8) - PAD.b (28)
const BASELINE = PAD.t + IH;

// --- barValueY: the value-to-pixel projection ------------------------------

test('barValueY lands zero on the baseline and the axis top on the plot ceiling', () => {
  assert.equal(barValueY(0, 100, IH), BASELINE);
  assert.equal(barValueY(100, 100, IH), PAD.t);
});

test('barValueY is linear between the two ends', () => {
  assert.equal(barValueY(50, 100, IH), PAD.t + IH / 2);
  assert.equal(barValueY(25, 100, IH), PAD.t + IH * 0.75);
});

test('barValueY clamps a negative value to the baseline rather than drawing below it', () => {
  // A one-axis bar chart has no room under the baseline: PAD.b is the category
  // labels' band, not headroom for a negative bar.
  for (const negative of [-1, -50, -1e6])
    assert.equal(barValueY(negative, 100, IH), BASELINE, `barValueY(${negative})`);
});

test('barValueY grows upward monotonically, so a bigger value is never a shorter bar', () => {
  const ys = [0, 1, 10, 42, 99, 100].map((v) => barValueY(v, 100, IH));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], `y[${i}] should sit above y[${i - 1}]`);
});

test('barValueY never leaves the plot for a value inside the axis', () => {
  for (const v of [0, 3, 17, 60, 100]) {
    const y = barValueY(v, 100, IH);
    assert.ok(y >= PAD.t && y <= BASELINE, `y=${y} for value ${v}`);
  }
});

// --- barColumns: the horizontal layout -------------------------------------

test('the columns tile the plot edge to edge, with the pitch as the only spacing', () => {
  const { step, columns } = barColumns(4, 600);
  assert.equal(columns.length, 4);
  assert.equal(columns[0].hitX, PAD.l);
  for (let i = 1; i < columns.length; i++)
    assert.equal(columns[i].hitX - columns[i - 1].hitX, step, `pitch between column ${i - 1} and ${i}`);
  // The last column's right edge is the plot's right edge: nothing is left over.
  assert.equal(columns[columns.length - 1].hitX + step, 600 - PAD.r);
});

test('the hit target is a whole column, always wider than the mark drawn in it', () => {
  // This is what keeps a 1px-tall bar hoverable: the rect is bound to `step` and
  // the full plot height, not to the bar's own width or height.
  const { step, barWidth } = barColumns(4, 600);
  assert.ok(step > barWidth, `column ${step} should exceed mark ${barWidth}`);
  assert.equal(step - barWidth, 2);
});

test('the 2px between bars is surface showing through, split evenly either side', () => {
  // Not a stroke on the bar: the mark is inset by half the gap at each edge, so
  // what shows between two bars is the plot background, 1px from each neighbour.
  const { step, barWidth, columns } = barColumns(3, 600);
  for (const column of columns) {
    assert.equal(column.x - column.hitX, 1, 'left inset');
    assert.equal(column.hitX + step - (column.x + barWidth), 1, 'right inset');
  }
});

test('midX is the column centre, which the label and the tooltip both align to', () => {
  const { step, columns } = barColumns(5, 600);
  for (const column of columns) assert.equal(column.midX, column.hitX + step / 2);
});

test('a mark never collapses below 1px, however many bars are crowded in', () => {
  // step - 2 goes negative past ~276 bars in a 600px plot; the floor is what keeps
  // barPath receiving a drawable width instead of an inverted one.
  const { barWidth } = barColumns(400, 600);
  assert.ok(barWidth >= 1, `barWidth was ${barWidth}`);
  assert.equal(barWidth, 1);
});

test('the plot width floors at 1px, so a zero-width or unmeasured container still lays out', () => {
  for (const width of [0, PAD.l + PAD.r, -100]) {
    const { step, columns } = barColumns(2, width);
    assert.ok(Number.isFinite(step) && step > 0, `step was ${step} at width ${width}`);
    for (const column of columns)
      assert.ok(Number.isFinite(column.x) && Number.isFinite(column.midX), 'every coordinate stays finite');
  }
});

test('no bars means no columns, and no division by zero in the pitch', () => {
  const { step, columns } = barColumns(0, 600);
  assert.deepEqual(columns, []);
  assert.ok(Number.isFinite(step) && step > 0, `step was ${step}`);
});

test('one bar takes the whole plot width', () => {
  const { step, columns } = barColumns(1, 600);
  assert.equal(step, 600 - PAD.l - PAD.r);
  assert.equal(columns[0].midX, PAD.l + step / 2);
});
