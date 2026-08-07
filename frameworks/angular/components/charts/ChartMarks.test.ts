import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_CHART_HEIGHT, ARENA_PAD } from '../../DataVisuals';
import { arenaBarPath, arenaArcPath, arenaLinePoints, arenaLineAreaPath } from './ChartMarks';
import { arenaDoughnutSlices } from './ChartScales';
import { arenaDoughnutRadii } from './ChartAxis';

const BASELINE = ARENA_PAD.t + 244;

function controlPoints(d: string): [number, number][] {
  return [...d.matchAll(/Q(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

test('arenaBarPath is square at the baseline and rounded only at the data end', () => {
  const [x, y, w, h, r] = [10, 20, 30, 100, 6];
  const d = arenaBarPath(x, y, w, h, r);

  assert.ok(d.startsWith(`M${x},${y + h} `), `starts at the baseline: ${d}`);
  assert.ok(d.includes(`L${x + w},${y + h} Z`), `closes along the baseline: ${d}`);

  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two rounded corners');
  for (const [, py] of points) assert.equal(py, y, 'a curve control point is on the data end');
});

test('arenaBarPath never rounds wider than half the bar or taller than the bar', () => {

  assert.equal(arenaBarPath(0, 0, 10, 100, 999), arenaBarPath(0, 0, 10, 100, 5), 'clamped to w / 2');
  assert.equal(arenaBarPath(0, 0, 100, 3, 999), arenaBarPath(0, 0, 100, 3, 3), 'clamped to h');
});

test('arenaBarPath with no radius is a plain rectangle path', () => {
  const [x, y, w, h] = [0, 0, 10, 40];
  const d = arenaBarPath(x, y, w, h, -5);

  const points = controlPoints(d);
  assert.equal(points.length, 2, 'exactly two corners');
  const corners = [[x, y], [x + w, y]];
  points.forEach(([px, py], i) => {
    assert.deepEqual([px, py], corners[i], `control point sits on the corner: ${d}`);
    assert.ok(d.includes(`${px},${py} ${px},${py}`), `endpoint collapses onto the same corner: ${d}`);
  });
  assert.ok(d.startsWith(`M${x},${y + h} `));
});

function subpathCount(d: string): number {
  return (d.match(/M/g) ?? []).length;
}

test('arenaArcPath draws an ordinary segment as a single subpath', () => {
  const d = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.equal(subpathCount(d), 1);
});

test('arenaArcPath splits a full circle into two arcs rather than a degenerate one', () => {

  const full = arenaArcPath(50, 50, 40, 20, 0, Math.PI * 2);
  assert.equal(subpathCount(full), 2, 'two halves, not one degenerate arc');
  const [first, second] = full.split(' M').map((s, i) => (i === 0 ? s : `M${s}`));

  assert.equal(first.match(/^M(-?[\d.]+),(-?[\d.]+)/)?.[0], 'M90,50');
  assert.ok(second.startsWith('M10,50'), `the second half starts opposite: ${second}`);
});

test('arenaArcPath treats a sweep beyond a full turn as a full circle too', () => {
  assert.equal(subpathCount(arenaArcPath(50, 50, 40, 20, 0, Math.PI * 2 + 0.5)), 2);
});

test('arenaArcPath sets the large-arc flag only past a half turn', () => {
  const small = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  const large = arenaArcPath(50, 50, 40, 20, 0, Math.PI * 1.5);
  assert.match(small, /A40,40 0 0 1 /);
  assert.match(large, /A40,40 0 1 1 /);
});

test('arenaArcPath sweeps the outer edge forward and the inner edge back', () => {

  const d = arenaArcPath(50, 50, 40, 20, 0, Math.PI / 2);
  assert.match(d, /A40,40 0 0 1 .* A20,20 0 0 0 .*Z$/);
});

test('arenaArcPath places its corners on the two radii at the two angles', () => {
  const d = arenaArcPath(0, 0, 10, 5, 0, Math.PI / 2);

  assert.ok(d.startsWith('M10,0 '), d);
  assert.ok(d.endsWith('5,0 Z'), d);
});

test('a full-circle slice is drawn as two arcs, because one would collapse to nothing', () => {

  const [only] = arenaDoughnutSlices([42]);
  const { outer, inner } = arenaDoughnutRadii(400, ARENA_CHART_HEIGHT);
  const d = arenaArcPath(200, ARENA_CHART_HEIGHT / 2, outer, inner, only.from, only.to);
  assert.equal(subpathCount(d), 2, `a full circle must be two subpaths: "${d}"`);
  assert.ok(!d.includes('NaN'), `the path is not a real path: "${d}"`);
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
