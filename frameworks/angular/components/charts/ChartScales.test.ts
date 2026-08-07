import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_CHART_HEIGHT, ARENA_PAD } from '../../DataVisuals';
import { chartBarGap } from '../../Tokens.generated';
import {
  arenaLinearScale, arenaScaleValue, arenaScaleInvert, arenaScaleZero, arenaValueY,
  arenaBandScale, arenaBandStart, arenaBandMark, arenaBandCenter,
  arenaPointScale, arenaPointAt, arenaNearestPointIndex, arenaDoughnutSlices,
} from './ChartScales';
import { arenaPlotBox } from './ChartAxis';

const IH = 244;
const BASELINE = ARENA_PAD.t + IH;
const IW = 600 - ARENA_PAD.l - ARENA_PAD.r;
const Y = arenaLinearScale(0, 100, BASELINE, ARENA_PAD.t);
const TWO_PI = Math.PI * 2;
const TWELVE_OCLOCK = -Math.PI / 2;

test('arenaValueY lands zero on the baseline and the axis top on the plot ceiling', () => {
  assert.equal(arenaValueY(Y, 0), BASELINE);
  assert.equal(arenaValueY(Y, 100), ARENA_PAD.t);
});

test('arenaValueY is linear between the two ends', () => {
  assert.equal(arenaValueY(Y, 50), ARENA_PAD.t + IH / 2);
  assert.equal(arenaValueY(Y, 25), ARENA_PAD.t + IH * 0.75);
});

test('arenaValueY clamps a negative value to the baseline rather than drawing below it', () => {

  for (const negative of [-1, -50, -1e6])
    assert.equal(arenaValueY(Y, negative), BASELINE, `arenaValueY(${negative})`);
});

test('arenaValueY grows upward monotonically, so a bigger value is never a shorter mark', () => {
  const ys = [0, 1, 10, 42, 99, 100].map((v) => arenaValueY(Y, v));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], `y[${i}] should sit above y[${i - 1}]`);
});

test('arenaValueY never leaves the plot for a value inside the axis', () => {
  for (const v of [0, 3, 17, 60, 100]) {
    const y = arenaValueY(Y, v);
    assert.ok(y >= ARENA_PAD.t && y <= BASELINE, `y=${y} for value ${v}`);
  }
});

test('a series spans the plot edge to edge, first point on the left pad and last on the right', () => {

  assert.equal(arenaPointAt(arenaPointScale(5, ARENA_PAD.l, IW), 0), ARENA_PAD.l);
  assert.equal(arenaPointAt(arenaPointScale(5, ARENA_PAD.l, IW), 4), ARENA_PAD.l + IW);
});

test('the points are evenly spaced, with count - 1 intervals rather than count', () => {
  const xs = [0, 1, 2, 3, 4].map((i) => arenaPointAt(arenaPointScale(5, ARENA_PAD.l, IW), i));
  const step = xs[1] - xs[0];
  for (let i = 1; i < xs.length; i++)
    assert.equal(xs[i] - xs[i - 1], step, `interval between point ${i - 1} and ${i}`);
  assert.equal(step, IW / 4);
});

test('a lone point centres in the plot instead of pinning to the left edge', () => {

  assert.equal(arenaPointAt(arenaPointScale(1, ARENA_PAD.l, IW), 0), ARENA_PAD.l + IW / 2);
});

test('a count of zero never divides by zero -- the coordinate stays finite', () => {
  const x = arenaPointAt(arenaPointScale(0, ARENA_PAD.l, IW), 0);
  assert.ok(Number.isFinite(x), `arenaPointAt returned ${x}`);
  assert.equal(x, ARENA_PAD.l + IW / 2);
});

test('every point of a series stays inside the plot horizontally', () => {
  for (let i = 0; i < 7; i++) {
    const x = arenaPointAt(arenaPointScale(7, ARENA_PAD.l, IW), i);
    assert.ok(x >= ARENA_PAD.l && x <= ARENA_PAD.l + IW, `x=${x} for point ${i}`);
  }
});

function bandsAcross(count: number, width: number) {
  const box = arenaPlotBox(width, ARENA_CHART_HEIGHT);
  return arenaBandScale(count, box.x, box.w, chartBarGap);
}

test('the bands tile the plot edge to edge, with the pitch as the only spacing', () => {
  const bands = bandsAcross(4, 600);
  assert.equal(bands.count, 4);
  assert.equal(arenaBandStart(bands, 0), ARENA_PAD.l);
  for (let i = 1; i < bands.count; i++)
    assert.equal(arenaBandStart(bands, i) - arenaBandStart(bands, i - 1), bands.step, `pitch between band ${i - 1} and ${i}`);

  assert.equal(arenaBandStart(bands, bands.count - 1) + bands.step, 600 - ARENA_PAD.r);
});

test('the hit target is a whole band, always wider than the mark drawn in it', () => {

  const bands = bandsAcross(4, 600);
  assert.ok(bands.step > bands.band, `band ${bands.step} should exceed mark ${bands.band}`);
  assert.equal(bands.step - bands.band, 2);
});

test('the 2px between bars is surface showing through, split evenly either side', () => {

  const bands = bandsAcross(3, 600);
  for (let i = 0; i < bands.count; i++) {
    assert.equal(arenaBandMark(bands, i) - arenaBandStart(bands, i), 1, 'left inset');
    assert.equal(arenaBandStart(bands, i) + bands.step - (arenaBandMark(bands, i) + bands.band), 1, 'right inset');
  }
});

test('arenaBandCenter is the band centre, which the label and the tooltip both align to', () => {
  const bands = bandsAcross(5, 600);
  for (let i = 0; i < bands.count; i++)
    assert.equal(arenaBandCenter(bands, i), arenaBandStart(bands, i) + bands.step / 2);
});

test('a mark never collapses below 1px, however many bars are crowded in', () => {

  const bands = bandsAcross(400, 600);
  assert.ok(bands.band >= 1, `band was ${bands.band}`);
  assert.equal(bands.band, 1);
});

test('the plot width floors at 1px, so a zero-width or unmeasured container still lays out', () => {
  for (const width of [0, ARENA_PAD.l + ARENA_PAD.r, -100]) {
    const bands = bandsAcross(2, width);
    assert.ok(Number.isFinite(bands.step) && bands.step > 0, `step was ${bands.step} at width ${width}`);
    for (let i = 0; i < bands.count; i++)
      assert.ok(Number.isFinite(arenaBandMark(bands, i)) && Number.isFinite(arenaBandCenter(bands, i)),
        'every coordinate stays finite');
  }
});

test('no bars means no bands, and no division by zero in the pitch', () => {
  const bands = bandsAcross(0, 600);
  assert.equal(bands.count, 0);
  assert.ok(Number.isFinite(bands.step) && bands.step > 0, `step was ${bands.step}`);
});

test('one bar takes the whole plot width', () => {
  const bands = bandsAcross(1, 600);
  assert.equal(bands.step, 600 - ARENA_PAD.l - ARENA_PAD.r);
  assert.equal(arenaBandCenter(bands, 0), ARENA_PAD.l + bands.step / 2);
});

test('a linear scale maps its domain onto its range, ends included', () => {
  const scale = arenaLinearScale(0, 100, 252, 8);
  assert.equal(arenaScaleValue(scale, 0), 252);
  assert.equal(arenaScaleValue(scale, 100), 8);
  assert.equal(arenaScaleValue(scale, 50), 130);
});

test('a linear scale does not clamp: reading past the domain reads past the range', () => {

  const scale = arenaLinearScale(0, 100, 252, 8);
  assert.equal(arenaScaleValue(scale, -50), 374);
  assert.equal(arenaScaleValue(scale, 150), -114);
});

test('arenaScaleInvert is the inverse of arenaScaleValue over the whole range', () => {
  const scale = arenaLinearScale(0, 100, 252, 8);
  for (const value of [0, 1, 25, 50, 99, 100])
    assert.ok(Math.abs(arenaScaleInvert(scale, arenaScaleValue(scale, value)) - value) < 1e-9, `value ${value}`);
});

test('a scale with no span never divides by zero -- every value lands on the range start', () => {

  const flat = arenaLinearScale(5, 5, 252, 8);
  assert.equal(arenaScaleValue(flat, 5), 252);
  assert.equal(arenaScaleValue(flat, 99), 252);
  assert.equal(arenaScaleInvert(arenaLinearScale(0, 100, 8, 8), 42), 0);
});

test('arenaScaleZero is where the value zero lands, which is the baseline today', () => {
  assert.equal(arenaScaleZero(arenaLinearScale(0, 100, 252, 8)), 252);

  assert.equal(arenaScaleZero(arenaLinearScale(-50, 50, 252, 8)), 130);
});

const POINTS = [0, 1, 2, 3, 4].map((i) => ({ x: arenaPointAt(arenaPointScale(5, ARENA_PAD.l, IW), i), y: 0 }));

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

test('the ring starts at 12 o\'clock, not at 3 o\'clock where SVG angles begin', () => {

  assert.equal(arenaDoughnutSlices([1, 2, 3])[0].from, TWELVE_OCLOCK);
});

test('each slice starts exactly where the previous one ended, leaving no seam', () => {
  const slices = arenaDoughnutSlices([5, 3, 2, 7]);
  for (let i = 1; i < slices.length; i++)
    assert.equal(slices[i].from, slices[i - 1].to, `slice ${i} does not begin where slice ${i - 1} ended`);
});

test('the slices close the full circle, so the ring has no missing wedge', () => {
  const slices = arenaDoughnutSlices([5, 3, 2, 7]);
  const swept = slices[slices.length - 1].to - slices[0].from;
  assert.ok(Math.abs(swept - TWO_PI) < 1e-9, `the ring swept ${swept} radians, not 2pi`);
});

test('a slice\'s angle is proportional to its share of the total', () => {

  const slices = arenaDoughnutSlices([25, 50, 25]);
  assert.ok(Math.abs(slices[0].to - slices[0].from - TWO_PI * 0.25) < 1e-9);
  assert.ok(Math.abs(slices[1].to - slices[1].from - TWO_PI * 0.5) < 1e-9);
  assert.ok(Math.abs(slices[2].to - slices[2].from - TWO_PI * 0.25) < 1e-9);
});

test('the shares of a whole ring sum to exactly one', () => {
  const total = arenaDoughnutSlices([3, 1, 4, 1, 5, 9]).reduce((sum, slice) => sum + slice.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `the shares summed to ${total}`);
});

test('a negative value is floored at zero rather than sweeping the ring backwards', () => {

  const slices = arenaDoughnutSlices([-10, 30, 70]);
  assert.equal(slices[0].share, 0);
  assert.equal(slices[0].to, slices[0].from, 'a negative slice must be zero-width, not reversed');
  assert.ok(Math.abs(slices[1].share - 0.3) < 1e-9, 'the negative value must not enlarge the total');
  assert.ok(Math.abs(slices[2].share - 0.7) < 1e-9);
});

test('a negative value never makes the ring over- or under-sweep', () => {
  const slices = arenaDoughnutSlices([-10, 30, 70]);
  const swept = slices[slices.length - 1].to - slices[0].from;
  assert.ok(Math.abs(swept - TWO_PI) < 1e-9, `the ring swept ${swept} radians, not 2pi`);
});

test('no values produce no slices, rather than one empty ring', () => {
  assert.deepEqual(arenaDoughnutSlices([]), []);
});

test('a total of zero never divides by zero -- every share is a real 0', () => {

  for (const slice of arenaDoughnutSlices([0, 0, 0])) {
    assert.equal(slice.share, 0);
    assert.equal(slice.percent, 0);
    assert.ok(Number.isFinite(slice.from) && Number.isFinite(slice.to), `angles were ${slice.from}..${slice.to}`);
    assert.equal(slice.to, slice.from, 'a zero-total slice must be zero-width, so the component draws no path');
  }
});

test('a zero value inside real data is zero-width and does not disturb its neighbours', () => {
  const slices = arenaDoughnutSlices([50, 0, 50]);
  assert.equal(slices[1].to, slices[1].from);
  assert.equal(slices[0].to, slices[2].from, 'the zero-width slice must not open a gap between its neighbours');
});

test('percent is the share rounded to whole numbers, which is what the hole reads', () => {
  const slices = arenaDoughnutSlices([1, 1, 1]);
  for (const slice of slices) assert.equal(slice.percent, 33, 'one third reads as 33%, not 33.333');
});

test('rounding is to nearest, not truncation -- a two-thirds slice reads 67%', () => {
  assert.equal(arenaDoughnutSlices([2, 1])[0].percent, 67);
});

test('the rounded percentages need not sum to 100, and that is honest rather than fudged', () => {

  const total = arenaDoughnutSlices([1, 1, 1]).reduce((sum, slice) => sum + slice.percent, 0);
  assert.equal(total, 99);
});

test('a whole ring in one slice reads 100%', () => {
  assert.equal(arenaDoughnutSlices([42])[0].percent, 100);
});

test('a lone slice sweeps the entire circle', () => {
  const [only] = arenaDoughnutSlices([42]);
  assert.equal(only.share, 1);
  assert.ok(Math.abs(only.to - only.from - TWO_PI) < 1e-9);
});
