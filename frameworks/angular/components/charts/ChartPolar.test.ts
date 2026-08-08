/* The polar grid a radar draws on. It starts at 12 o'clock and runs clockwise, the same
 * way arenaDoughnutSlices does, so two radial charts on one page do not begin in
 * different places. What this suite cannot see is whether the axes are legible at the
 * count given: past eight or so the labels collide, and that is on the by-hand list. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arenaPolarAngle, arenaPolarPoint, arenaPolarIndex, arenaPolarAnchor, arenaRadarRings,
  arenaRadarRadius, arenaRadarLabelRadius,
} from './ChartPolar';
import { arenaNiceDomain } from './ChartScales';

test('the first axis stands at 12 o\'clock, where the ring already starts', () => {
  assert.equal(arenaPolarAngle(0, 5), -Math.PI / 2);
  const point = arenaPolarPoint(100, 100, 40, 0, 5);
  assert.ok(Math.abs(point.x - 100) < 1e-9, `got x ${point.x}`);
  assert.ok(Math.abs(point.y - 60) < 1e-9, `straight up is a smaller y, got ${point.y}`);
});

test('the axes run clockwise and divide the turn evenly', () => {

  const quarter = arenaPolarPoint(100, 100, 40, 1, 4);
  assert.ok(Math.abs(quarter.x - 140) < 1e-9, `the second of four is due right, got x ${quarter.x}`);
  assert.ok(Math.abs(quarter.y - 100) < 1e-9, `got y ${quarter.y}`);
});

test('a full turn of axes closes, so the last one does not overlap the first', () => {
  const count = 6;
  const first = arenaPolarPoint(0, 0, 10, 0, count);
  const past = arenaPolarPoint(0, 0, 10, count, count);
  assert.ok(Math.abs(first.x - past.x) < 1e-9 && Math.abs(first.y - past.y) < 1e-9,
    'index count must land back on index 0, or the axes do not tile the circle');
});

test('a radius of zero puts every axis on the centre, which is what a value of zero means', () => {
  for (const index of [0, 1, 2, 3]) {
    const point = arenaPolarPoint(50, 50, 0, index, 4);
    assert.ok(Math.abs(point.x - 50) < 1e-9 && Math.abs(point.y - 50) < 1e-9, `axis ${index}`);
  }
});

test('a pointer anywhere on an axis reads that axis, and the seam does not read as -1', () => {

  const count = 5;
  for (let index = 0; index < count; index += 1) {
    const on = arenaPolarPoint(100, 100, 60, index, count);
    assert.equal(arenaPolarIndex(100, 100, on.x, on.y, count), index, `axis ${index}`);
  }
});

test('a pointer just short of 12 o\'clock wraps to the first axis rather than off the end', () => {

  const count = 4;
  const nearlyRound = arenaPolarPoint(100, 100, 60, 3.6, count);
  assert.equal(arenaPolarIndex(100, 100, nearlyRound.x, nearlyRound.y, count), 0);
});

test('the centre itself reads an axis rather than throwing, because a pointer can rest there', () => {
  const index = arenaPolarIndex(100, 100, 100, 100, 5);
  assert.ok(index >= 0 && index < 5, `got ${index}`);
});

test('no axes read as no axis, rather than as the first one', () => {
  assert.equal(arenaPolarIndex(0, 0, 10, 10, 0), -1);
  assert.equal(arenaPolarAngle(0, 0), -Math.PI / 2, 'the angle still answers, so a lone centre draws');
});

test('a ring is drawn per tick above the centre, and never one at the centre itself', () => {

  const domain = arenaNiceDomain(0, 100);
  const rings = arenaRadarRings(domain);
  assert.ok(rings.length > 0, 'a grid of no rings is a grid nobody can read a value against');
  assert.ok(rings.every((value) => value > 0), `a ring of radius zero is the centre point, got ${rings.join(', ')}`);
  assert.ok(Math.abs((rings[rings.length - 1] as number) - domain.max) < 1e-9,
    'the outermost ring is the domain, so the polygon never crosses a ring that is not there');
});

test('a domain with no step draws no rings rather than looping forever', () => {
  assert.deepEqual(arenaRadarRings({ min: 0, max: 0, step: 0 }), []);
});

test('an axis label is anchored away from the centre, so a full-value vertex does not sit on it', () => {

  assert.equal(arenaPolarAnchor(0, 4), 'middle', 'straight up, centred over its own axis');
  assert.equal(arenaPolarAnchor(1, 4), 'start', 'due east, so the text runs outward');
  assert.equal(arenaPolarAnchor(2, 4), 'middle', 'straight down');
  assert.equal(arenaPolarAnchor(3, 4), 'end', 'due west, so the text runs outward the other way');
});

test('every axis of an odd count is anchored on the side it points to', () => {
  for (const index of [1, 2]) assert.equal(arenaPolarAnchor(index, 5), 'start', `axis ${index} points east`);
  for (const index of [3, 4]) assert.equal(arenaPolarAnchor(index, 5), 'end', `axis ${index} points west`);
});

test('the labels ring sits outside the grid, which is what stops a vertex landing on one', () => {

  const grid = arenaRadarRadius(600, 280);
  const labels = arenaRadarLabelRadius(600, 280);
  assert.ok(labels > grid, `labels at ${labels} must be outside a grid of ${grid}`);
  assert.ok(grid > 0, 'the grid still has a radius to draw on');
});

test('the grid leaves room for a label rather than reaching the edge of its box', () => {

  const grid = arenaRadarRadius(600, 280);
  assert.ok(arenaRadarLabelRadius(600, 280) <= 280 / 2, 'the label ring must stay inside the shorter axis of the box');
  assert.ok(grid < 280 / 2, 'a grid that reached the edge would leave the labels nowhere to go');
});

test('the grid stays positive in a box too small to hold a label at all', () => {
  for (const size of [0, 1, 28, 56]) assert.ok(arenaRadarRadius(size, size) > 0, `at ${size}px`);
});
