/* LineChart's geometry, extracted from the component so it can be asserted against
 * real numbers -- the same resolution bar-chart-geometry.test.ts took, for the same
 * reason: the component's own `computed()` fields read signal inputs, and a signal
 * input cannot be driven under this harness (bun's TypeScript stripping plus
 * `@angular/compiler`'s template JIT, never `ngtsc`), so `[values]="..."` fails
 * NG0303 and a literal attribute is a silent no-op. `lineX`, `lineValueY`,
 * `nearestPointIndex`, `linePoints` and `lineAreaPath` are therefore plain exported
 * functions that the component composes, and they carry the geometry this file pins.
 *
 * chart-internals.test.ts already covers niceMax, ticks and resolveColors; none of
 * that is repeated here. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { PAD } from '../primitives/chart-internals';
import { lineX, lineValueY, nearestPointIndex, linePoints, lineAreaPath } from '../primitives/line-chart/line-chart';

const IH = 244; // CHART_HEIGHT (280) - PAD.t (8) - PAD.b (28)
const BASELINE = PAD.t + IH;
const IW = 600 - PAD.l - PAD.r;

// --- lineX: the horizontal projection ---------------------------------------

test('a series spans the plot edge to edge, first point on the left pad and last on the right', () => {
  // Unlike a bar, a point sits ON the plot edge rather than inside a column: the
  // line has to reach both ends or it reads as a series with missing data.
  assert.equal(lineX(0, 5, IW), PAD.l);
  assert.equal(lineX(4, 5, IW), PAD.l + IW);
});

test('the points are evenly spaced, with count - 1 intervals rather than count', () => {
  const xs = [0, 1, 2, 3, 4].map((i) => lineX(i, 5, IW));
  const step = xs[1] - xs[0];
  for (let i = 1; i < xs.length; i++)
    assert.equal(xs[i] - xs[i - 1], step, `interval between point ${i - 1} and ${i}`);
  assert.equal(step, IW / 4);
});

test('a lone point centres in the plot instead of pinning to the left edge', () => {
  // At the left edge it would read as a series that starts and stops immediately.
  assert.equal(lineX(0, 1, IW), PAD.l + IW / 2);
});

test('a count of zero never divides by zero -- the coordinate stays finite', () => {
  const x = lineX(0, 0, IW);
  assert.ok(Number.isFinite(x), `lineX returned ${x}`);
  assert.equal(x, PAD.l + IW / 2);
});

test('every point of a series stays inside the plot horizontally', () => {
  for (let i = 0; i < 7; i++) {
    const x = lineX(i, 7, IW);
    assert.ok(x >= PAD.l && x <= PAD.l + IW, `x=${x} for point ${i}`);
  }
});

// --- lineValueY: the value-to-pixel projection ------------------------------

test('lineValueY lands zero on the baseline and the axis top on the plot ceiling', () => {
  assert.equal(lineValueY(0, 100, IH), BASELINE);
  assert.equal(lineValueY(100, 100, IH), PAD.t);
});

test('lineValueY is linear between the two ends', () => {
  assert.equal(lineValueY(50, 100, IH), PAD.t + IH / 2);
  assert.equal(lineValueY(25, 100, IH), PAD.t + IH * 0.75);
});

test('lineValueY clamps a negative value to the baseline rather than drawing below it', () => {
  // A one-axis line chart has no room under the baseline: PAD.b is the point
  // labels' band, not headroom for a negative value.
  for (const negative of [-1, -50, -1e6])
    assert.equal(lineValueY(negative, 100, IH), BASELINE, `lineValueY(${negative})`);
});

test('lineValueY grows upward monotonically, so a bigger value is never a lower point', () => {
  const ys = [0, 1, 10, 42, 99, 100].map((v) => lineValueY(v, 100, IH));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], `y[${i}] should sit above y[${i - 1}]`);
});

// --- nearestPointIndex: what the crosshair snaps to -------------------------

const POINTS = [0, 1, 2, 3, 4].map((i) => ({ x: lineX(i, 5, IW), y: 0 }));

test('the crosshair snaps to the point the pointer is actually nearest', () => {
  for (let i = 0; i < POINTS.length; i++)
    assert.equal(nearestPointIndex(POINTS, POINTS[i].x), i, `pointer sitting exactly on point ${i}`);
});

test('a pointer between two points takes the nearer one, not the earlier one', () => {
  const step = POINTS[1].x - POINTS[0].x;
  assert.equal(nearestPointIndex(POINTS, POINTS[0].x + step * 0.4), 0);
  assert.equal(nearestPointIndex(POINTS, POINTS[0].x + step * 0.6), 1);
});

test('an exact tie goes to the earlier point, so the crosshair never flickers between two', () => {
  const midpoint = (POINTS[1].x + POINTS[2].x) / 2;
  assert.equal(nearestPointIndex(POINTS, midpoint), 1);
});

test('a pointer outside the series clamps to the nearest end rather than losing the hover', () => {
  assert.equal(nearestPointIndex(POINTS, -1e6), 0);
  assert.equal(nearestPointIndex(POINTS, 1e6), POINTS.length - 1);
});

test('an empty series reports -1, which the component reads as "do not set a hover"', () => {
  // The component gates on `index >= 0`: without the sentinel an empty series
  // would hover index 0, and `active()` would then read points()[0] of nothing.
  assert.equal(nearestPointIndex([], 100), -1);
});

test('a single point wins every pointer position', () => {
  assert.equal(nearestPointIndex([{ x: 300, y: 0 }], 0), 0);
  assert.equal(nearestPointIndex([{ x: 300, y: 0 }], 1e6), 0);
});

// --- linePoints and lineAreaPath: the marks ---------------------------------

test('the polyline is the coordinate pairs in series order, space separated', () => {
  assert.equal(linePoints([{ x: 1, y: 2 }, { x: 3, y: 4 }]), '1,2 3,4');
});

test('an empty series produces an empty polyline rather than a stray coordinate', () => {
  assert.equal(linePoints([]), '');
});

test('the area path closes the series down to the baseline at both ends', () => {
  const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }];
  const d = lineAreaPath(points, BASELINE);
  // Starts on the baseline under the first point, traces the line, returns to the
  // baseline under the last point, and closes -- anything else leaves the fill open
  // or fills against the wrong edge.
  assert.equal(d, `M10,${BASELINE} L10,20 L30,40 L50,60 L50,${BASELINE} Z`);
});

test('the area path traces the same coordinates the polyline does', () => {
  const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
  const d = lineAreaPath(points, BASELINE);
  for (const point of points)
    assert.ok(d.includes(`${point.x},${point.y}`), `the area path is missing point ${point.x},${point.y}`);
});

test('an empty series paints no area at all, rather than an M-only path', () => {
  assert.equal(lineAreaPath([], BASELINE), '');
});

test('a single point still closes into a real (zero-width) region', () => {
  assert.equal(lineAreaPath([{ x: 10, y: 20 }], BASELINE), `M10,${BASELINE} L10,20 L10,${BASELINE} Z`);
});
