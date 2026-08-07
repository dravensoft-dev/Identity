import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_CHART_HEIGHT, ARENA_PAD } from '../../DataVisuals';
import { arenaPlotBox, arenaAxisTicks, arenaAxisModel, arenaTickLabelX, arenaCategoryLabelY, arenaDoughnutRadii } from './ChartAxis';
import { arenaLinearScale, arenaNiceDomain } from './ChartScales';

test('the tick label ends one label gap left of the plot, inside the left pad', () => {
  assert.equal(arenaTickLabelX(), ARENA_PAD.l - 8);
  assert.ok(arenaTickLabelX() > 0, 'the label must not sit off the left edge of the box');
});

test('the category label sits one label gap above the bottom edge of the box', () => {
  assert.equal(arenaCategoryLabelY(ARENA_CHART_HEIGHT), ARENA_CHART_HEIGHT - 8);
});

test('the plot box is the container inset by the pads on all four sides', () => {
  const box = arenaPlotBox(600, 280);
  assert.equal(box.x, ARENA_PAD.l);
  assert.equal(box.y, ARENA_PAD.t);
  assert.equal(box.w, 600 - ARENA_PAD.l - ARENA_PAD.r);
  assert.equal(box.h, 280 - ARENA_PAD.t - ARENA_PAD.b);
});

test('the plot box floors at 1px on both axes, so an unmeasured container still lays out', () => {
  for (const width of [0, ARENA_PAD.l + ARENA_PAD.r, -100])
    assert.ok(arenaPlotBox(width, 280).w >= 1, `width ${width}`);
  for (const height of [0, ARENA_PAD.t + ARENA_PAD.b, -100])
    assert.ok(arenaPlotBox(600, height).h >= 1, `height ${height}`);
});

test('an axis tick carries its value, its position on the scale and the written label', () => {
  const scale = arenaLinearScale(0, 100, 252, 8);
  const ticks = arenaAxisTicks(scale, [0, 50, 100], (value) => `${value}%`);
  assert.deepEqual(ticks, [
    { value: 0, y: 252, label: '0%' },
    { value: 50, y: 130, label: '50%' },
    { value: 100, y: 8, label: '100%' },
  ]);
});

test('a tick is placed by the scale itself, never floored the way a datum is', () => {

  const scale = arenaLinearScale(-50, 50, 252, 8);
  const [below] = arenaAxisTicks(scale, [-50], String);
  assert.equal(below?.y, 252, 'a tick below zero sits where the scale puts it');
});

test('no ticks produce no lines, rather than one at the origin', () => {
  assert.deepEqual(arenaAxisTicks(arenaLinearScale(0, 100, 252, 8), [], String), []);
});

test('the axis model puts zeroY on the plot floor while the domain starts at zero', () => {
  const domain = arenaNiceDomain(0, 128);
  const model = arenaAxisModel(arenaLinearScale(domain.min, domain.max, 252, 8), domain, String);
  assert.equal(model.zeroY, 252, 'the strong rule is the plot floor, which is what it always was');
  assert.equal(model.ticks[0]?.y, 252, 'and the first tick lands on it');
});

test('the axis model lifts zeroY off the floor the moment a value goes negative', () => {

  const domain = arenaNiceDomain(-20, 60);
  const model = arenaAxisModel(arenaLinearScale(domain.min, domain.max, 252, 8), domain, String);
  assert.ok(model.zeroY < 252 && model.zeroY > 8, `zeroY was ${model.zeroY}, not inside the plot`);
  assert.ok(model.ticks.some((tick) => Math.abs(tick.y - model.zeroY) < 1e-9),
    'the zero line must coincide with a tick, which is the whole point of the domain');
});

test('an all-negative domain puts zeroY at the plot ceiling', () => {
  const domain = arenaNiceDomain(-30, 0);
  const model = arenaAxisModel(arenaLinearScale(domain.min, domain.max, 252, 8), domain, String);
  assert.equal(model.zeroY, 8);
});

test('the ring fits the smaller of the plot\'s two axes, inset so its stroke is not clipped', () => {

  assert.equal(arenaDoughnutRadii(600, 280).outer, 280 / 2 - 8);

  assert.equal(arenaDoughnutRadii(100, 280).outer, 100 / 2 - 8);
});

test('the hole is 62% of the outer radius, so it scales with the ring instead of swallowing it', () => {
  const { outer, inner } = arenaDoughnutRadii(600, 280);
  assert.ok(Math.abs(inner / outer - 0.62) < 1e-9);
});

test('both radii stay positive in a plot too small to hold the inset', () => {

  for (const plot of [0, 1, 8, 16]) {
    const { outer, inner } = arenaDoughnutRadii(plot, ARENA_CHART_HEIGHT);
    assert.ok(outer > 0, `outer radius was ${outer} at plot width ${plot}`);
    assert.ok(inner > 0, `inner radius was ${inner} at plot width ${plot}`);
  }
});

test('the ring stays inside the plot box it is drawn in', () => {
  for (const plot of [120, 300, 600]) {
    const { outer } = arenaDoughnutRadii(plot, ARENA_CHART_HEIGHT);
    assert.ok(outer * 2 <= plot, `a ${outer * 2}px ring does not fit a ${plot}px plot`);
    assert.ok(outer * 2 <= ARENA_CHART_HEIGHT, `a ${outer * 2}px ring does not fit a ${ARENA_CHART_HEIGHT}px plot height`);
  }
});
