import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_PAD } from '../../../DataVisuals';
import { arenaLineX, arenaLineValueY, arenaNearestPointIndex, arenaLinePoints, arenaLineAreaPath } from './ArenaLineChart';

const IH = 244;
const BASELINE = ARENA_PAD.t + IH;
const IW = 600 - ARENA_PAD.l - ARENA_PAD.r;

test('a series spans the plot edge to edge, first point on the left pad and last on the right', () => {

  assert.equal(arenaLineX(0, 5, IW), ARENA_PAD.l);
  assert.equal(arenaLineX(4, 5, IW), ARENA_PAD.l + IW);
});

test('the points are evenly spaced, with count - 1 intervals rather than count', () => {
  const xs = [0, 1, 2, 3, 4].map((i) => arenaLineX(i, 5, IW));
  const step = xs[1] - xs[0];
  for (let i = 1; i < xs.length; i++)
    assert.equal(xs[i] - xs[i - 1], step, `interval between point ${i - 1} and ${i}`);
  assert.equal(step, IW / 4);
});

test('a lone point centres in the plot instead of pinning to the left edge', () => {

  assert.equal(arenaLineX(0, 1, IW), ARENA_PAD.l + IW / 2);
});

test('a count of zero never divides by zero -- the coordinate stays finite', () => {
  const x = arenaLineX(0, 0, IW);
  assert.ok(Number.isFinite(x), `arenaLineX returned ${x}`);
  assert.equal(x, ARENA_PAD.l + IW / 2);
});

test('every point of a series stays inside the plot horizontally', () => {
  for (let i = 0; i < 7; i++) {
    const x = arenaLineX(i, 7, IW);
    assert.ok(x >= ARENA_PAD.l && x <= ARENA_PAD.l + IW, `x=${x} for point ${i}`);
  }
});

test('arenaLineValueY lands zero on the baseline and the axis top on the plot ceiling', () => {
  assert.equal(arenaLineValueY(0, 100, IH), BASELINE);
  assert.equal(arenaLineValueY(100, 100, IH), ARENA_PAD.t);
});

test('arenaLineValueY is linear between the two ends', () => {
  assert.equal(arenaLineValueY(50, 100, IH), ARENA_PAD.t + IH / 2);
  assert.equal(arenaLineValueY(25, 100, IH), ARENA_PAD.t + IH * 0.75);
});

test('arenaLineValueY clamps a negative value to the baseline rather than drawing below it', () => {

  for (const negative of [-1, -50, -1e6])
    assert.equal(arenaLineValueY(negative, 100, IH), BASELINE, `arenaLineValueY(${negative})`);
});

test('arenaLineValueY grows upward monotonically, so a bigger value is never a lower point', () => {
  const ys = [0, 1, 10, 42, 99, 100].map((v) => arenaLineValueY(v, 100, IH));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], `y[${i}] should sit above y[${i - 1}]`);
});

const POINTS = [0, 1, 2, 3, 4].map((i) => ({ x: arenaLineX(i, 5, IW), y: 0 }));

test('the crosshair snaps to the point the pointer is actually nearest', () => {
  for (let i = 0; i < POINTS.length; i++)
    assert.equal(arenaNearestPointIndex(POINTS, POINTS[i].x), i, `pointer sitting exactly on point ${i}`);
});

test('a pointer between two points takes the nearer one, not the earlier one', () => {
  const step = POINTS[1].x - POINTS[0].x;
  assert.equal(arenaNearestPointIndex(POINTS, POINTS[0].x + step * 0.4), 0);
  assert.equal(arenaNearestPointIndex(POINTS, POINTS[0].x + step * 0.6), 1);
});

test('an exact tie goes to the earlier point, so the crosshair never flickers between two', () => {
  const midpoint = (POINTS[1].x + POINTS[2].x) / 2;
  assert.equal(arenaNearestPointIndex(POINTS, midpoint), 1);
});

test('a pointer outside the series clamps to the nearest end rather than losing the hover', () => {
  assert.equal(arenaNearestPointIndex(POINTS, -1e6), 0);
  assert.equal(arenaNearestPointIndex(POINTS, 1e6), POINTS.length - 1);
});

test('an empty series reports -1, which the component reads as "do not set a hover"', () => {

  assert.equal(arenaNearestPointIndex([], 100), -1);
});

test('a single point wins every pointer position', () => {
  assert.equal(arenaNearestPointIndex([{ x: 300, y: 0 }], 0), 0);
  assert.equal(arenaNearestPointIndex([{ x: 300, y: 0 }], 1e6), 0);
});

test('the polyline is the coordinate pairs in series order, space separated', () => {
  assert.equal(arenaLinePoints([{ x: 1, y: 2 }, { x: 3, y: 4 }]), '1,2 3,4');
});

test('an empty series produces an empty polyline rather than a stray coordinate', () => {
  assert.equal(arenaLinePoints([]), '');
});

test('the area path closes the series down to the baseline at both ends', () => {
  const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }];
  const d = arenaLineAreaPath(points, BASELINE);

  assert.equal(d, `M10,${BASELINE} L10,20 L30,40 L50,60 L50,${BASELINE} Z`);
});

test('the area path traces the same coordinates the polyline does', () => {
  const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
  const d = arenaLineAreaPath(points, BASELINE);
  for (const point of points)
    assert.ok(d.includes(`${point.x},${point.y}`), `the area path is missing point ${point.x},${point.y}`);
});

test('an empty series paints no area at all, rather than an M-only path', () => {
  assert.equal(arenaLineAreaPath([], BASELINE), '');
});

test('a single point still closes into a real (zero-width) region', () => {
  assert.equal(arenaLineAreaPath([{ x: 10, y: 20 }], BASELINE), `M10,${BASELINE} L10,20 L10,${BASELINE} Z`);
});
