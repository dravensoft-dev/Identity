import test from 'node:test';
import assert from 'node:assert/strict';
import { CHART_HEIGHT, arcPath } from '../../../DataVisuals';
import {
  doughnutSlices, doughnutLegendWidth, doughnutPlotWidth, doughnutRadii,
} from './DoughnutChart';

const TWO_PI = Math.PI * 2;
const TWELVE_OCLOCK = -Math.PI / 2;

test('the ring starts at 12 o\'clock, not at 3 o\'clock where SVG angles begin', () => {

  assert.equal(doughnutSlices([1, 2, 3])[0].from, TWELVE_OCLOCK);
});

test('each slice starts exactly where the previous one ended, leaving no seam', () => {
  const slices = doughnutSlices([5, 3, 2, 7]);
  for (let i = 1; i < slices.length; i++)
    assert.equal(slices[i].from, slices[i - 1].to, `slice ${i} does not begin where slice ${i - 1} ended`);
});

test('the slices close the full circle, so the ring has no missing wedge', () => {
  const slices = doughnutSlices([5, 3, 2, 7]);
  const swept = slices[slices.length - 1].to - slices[0].from;
  assert.ok(Math.abs(swept - TWO_PI) < 1e-9, `the ring swept ${swept} radians, not 2pi`);
});

test('a slice\'s angle is proportional to its share of the total', () => {

  const slices = doughnutSlices([25, 50, 25]);
  assert.ok(Math.abs(slices[0].to - slices[0].from - TWO_PI * 0.25) < 1e-9);
  assert.ok(Math.abs(slices[1].to - slices[1].from - TWO_PI * 0.5) < 1e-9);
  assert.ok(Math.abs(slices[2].to - slices[2].from - TWO_PI * 0.25) < 1e-9);
});

test('the shares of a whole ring sum to exactly one', () => {
  const total = doughnutSlices([3, 1, 4, 1, 5, 9]).reduce((sum, slice) => sum + slice.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `the shares summed to ${total}`);
});

test('a negative value is floored at zero rather than sweeping the ring backwards', () => {

  const slices = doughnutSlices([-10, 30, 70]);
  assert.equal(slices[0].share, 0);
  assert.equal(slices[0].to, slices[0].from, 'a negative slice must be zero-width, not reversed');
  assert.ok(Math.abs(slices[1].share - 0.3) < 1e-9, 'the negative value must not enlarge the total');
  assert.ok(Math.abs(slices[2].share - 0.7) < 1e-9);
});

test('a negative value never makes the ring over- or under-sweep', () => {
  const slices = doughnutSlices([-10, 30, 70]);
  const swept = slices[slices.length - 1].to - slices[0].from;
  assert.ok(Math.abs(swept - TWO_PI) < 1e-9, `the ring swept ${swept} radians, not 2pi`);
});

test('no values produce no slices, rather than one empty ring', () => {
  assert.deepEqual(doughnutSlices([]), []);
});

test('a total of zero never divides by zero -- every share is a real 0', () => {

  for (const slice of doughnutSlices([0, 0, 0])) {
    assert.equal(slice.share, 0);
    assert.equal(slice.percent, 0);
    assert.ok(Number.isFinite(slice.from) && Number.isFinite(slice.to), `angles were ${slice.from}..${slice.to}`);
    assert.equal(slice.to, slice.from, 'a zero-total slice must be zero-width, so the component draws no path');
  }
});

test('a zero value inside real data is zero-width and does not disturb its neighbours', () => {
  const slices = doughnutSlices([50, 0, 50]);
  assert.equal(slices[1].to, slices[1].from);
  assert.equal(slices[0].to, slices[2].from, 'the zero-width slice must not open a gap between its neighbours');
});

test('percent is the share rounded to whole numbers, which is what the hole reads', () => {
  const slices = doughnutSlices([1, 1, 1]);
  for (const slice of slices) assert.equal(slice.percent, 33, 'one third reads as 33%, not 33.333');
});

test('rounding is to nearest, not truncation -- a two-thirds slice reads 67%', () => {
  assert.equal(doughnutSlices([2, 1])[0].percent, 67);
});

test('the rounded percentages need not sum to 100, and that is honest rather than fudged', () => {

  const total = doughnutSlices([1, 1, 1]).reduce((sum, slice) => sum + slice.percent, 0);
  assert.equal(total, 99);
});

test('a whole ring in one slice reads 100%', () => {
  assert.equal(doughnutSlices([42])[0].percent, 100);
});

test('a lone slice sweeps the entire circle', () => {
  const [only] = doughnutSlices([42]);
  assert.equal(only.share, 1);
  assert.ok(Math.abs(only.to - only.from - TWO_PI) < 1e-9);
});

test('a full-circle slice is drawn as two arcs, because one would collapse to nothing', () => {

  const [only] = doughnutSlices([42]);
  const { outer, inner } = doughnutRadii(400, CHART_HEIGHT);
  const d = arcPath(200, CHART_HEIGHT / 2, outer, inner, only.from, only.to);
  assert.equal((d.match(/M/g) ?? []).length, 2, `a full circle must be two subpaths: "${d}"`);
  assert.ok(!d.includes('NaN'), `the path is not a real path: "${d}"`);
});

test('the legend takes 34% of a mid-size container', () => {
  assert.ok(Math.abs(doughnutLegendWidth(400) - 136) < 1e-9);
});

test('the legend never falls below its floor, however narrow the container', () => {

  for (const width of [0, 1, 100, 352]) assert.equal(doughnutLegendWidth(width), 120, `at width ${width}`);
});

test('the legend never exceeds its ceiling, however wide the container', () => {
  for (const width of [530, 600, 4000]) assert.equal(doughnutLegendWidth(width), 180, `at width ${width}`);
});

test('the plot is what is left after the legend and the gap between them', () => {
  assert.equal(doughnutPlotWidth(600), 600 - 180 - 16);
});

test('the plot width stays positive even in a container narrower than the legend alone', () => {
  for (const width of [0, 1, 50, 120]) {
    const plot = doughnutPlotWidth(width);
    assert.ok(plot >= 1, `plot width was ${plot} at container width ${width}`);
  }
});

test('the plot and the legend and the gap never claim more than the container has', () => {
  for (const width of [200, 400, 600, 1200]) {
    const used = doughnutPlotWidth(width) + doughnutLegendWidth(width) + 16;
    assert.ok(used <= width + 1e-9, `the layout claimed ${used} of a ${width}px container`);
  }
});

test('the ring fits the smaller of the plot\'s two axes, inset so its stroke is not clipped', () => {

  assert.equal(doughnutRadii(600, 280).outer, 280 / 2 - 8);

  assert.equal(doughnutRadii(100, 280).outer, 100 / 2 - 8);
});

test('the hole is 62% of the outer radius, so it scales with the ring instead of swallowing it', () => {
  const { outer, inner } = doughnutRadii(600, 280);
  assert.ok(Math.abs(inner / outer - 0.62) < 1e-9);
});

test('both radii stay positive in a plot too small to hold the inset', () => {

  for (const plot of [0, 1, 8, 16]) {
    const { outer, inner } = doughnutRadii(plot, CHART_HEIGHT);
    assert.ok(outer > 0, `outer radius was ${outer} at plot width ${plot}`);
    assert.ok(inner > 0, `inner radius was ${inner} at plot width ${plot}`);
  }
});

test('the ring stays inside the plot box it is drawn in', () => {
  for (const plot of [120, 300, 600]) {
    const { outer } = doughnutRadii(plot, CHART_HEIGHT);
    assert.ok(outer * 2 <= plot, `a ${outer * 2}px ring does not fit a ${plot}px plot`);
    assert.ok(outer * 2 <= CHART_HEIGHT, `a ${outer * 2}px ring does not fit a ${CHART_HEIGHT}px plot height`);
  }
});
