import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_PAD } from '../../../DataVisuals';
import { arenaBarValueY, arenaBarColumns } from './ArenaBarChart';

const IH = 244;
const BASELINE = ARENA_PAD.t + IH;

test('arenaBarValueY lands zero on the baseline and the axis top on the plot ceiling', () => {
  assert.equal(arenaBarValueY(0, 100, IH), BASELINE);
  assert.equal(arenaBarValueY(100, 100, IH), ARENA_PAD.t);
});

test('arenaBarValueY is linear between the two ends', () => {
  assert.equal(arenaBarValueY(50, 100, IH), ARENA_PAD.t + IH / 2);
  assert.equal(arenaBarValueY(25, 100, IH), ARENA_PAD.t + IH * 0.75);
});

test('arenaBarValueY clamps a negative value to the baseline rather than drawing below it', () => {

  for (const negative of [-1, -50, -1e6])
    assert.equal(arenaBarValueY(negative, 100, IH), BASELINE, `arenaBarValueY(${negative})`);
});

test('arenaBarValueY grows upward monotonically, so a bigger value is never a shorter bar', () => {
  const ys = [0, 1, 10, 42, 99, 100].map((v) => arenaBarValueY(v, 100, IH));
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], `y[${i}] should sit above y[${i - 1}]`);
});

test('arenaBarValueY never leaves the plot for a value inside the axis', () => {
  for (const v of [0, 3, 17, 60, 100]) {
    const y = arenaBarValueY(v, 100, IH);
    assert.ok(y >= ARENA_PAD.t && y <= BASELINE, `y=${y} for value ${v}`);
  }
});

test('the columns tile the plot edge to edge, with the pitch as the only spacing', () => {
  const { step, columns } = arenaBarColumns(4, 600);
  assert.equal(columns.length, 4);
  assert.equal(columns[0].hitX, ARENA_PAD.l);
  for (let i = 1; i < columns.length; i++)
    assert.equal(columns[i].hitX - columns[i - 1].hitX, step, `pitch between column ${i - 1} and ${i}`);

  assert.equal(columns[columns.length - 1].hitX + step, 600 - ARENA_PAD.r);
});

test('the hit target is a whole column, always wider than the mark drawn in it', () => {

  const { step, barWidth } = arenaBarColumns(4, 600);
  assert.ok(step > barWidth, `column ${step} should exceed mark ${barWidth}`);
  assert.equal(step - barWidth, 2);
});

test('the 2px between bars is surface showing through, split evenly either side', () => {

  const { step, barWidth, columns } = arenaBarColumns(3, 600);
  for (const column of columns) {
    assert.equal(column.x - column.hitX, 1, 'left inset');
    assert.equal(column.hitX + step - (column.x + barWidth), 1, 'right inset');
  }
});

test('midX is the column centre, which the label and the tooltip both align to', () => {
  const { step, columns } = arenaBarColumns(5, 600);
  for (const column of columns) assert.equal(column.midX, column.hitX + step / 2);
});

test('a mark never collapses below 1px, however many bars are crowded in', () => {

  const { barWidth } = arenaBarColumns(400, 600);
  assert.ok(barWidth >= 1, `barWidth was ${barWidth}`);
  assert.equal(barWidth, 1);
});

test('the plot width floors at 1px, so a zero-width or unmeasured container still lays out', () => {
  for (const width of [0, ARENA_PAD.l + ARENA_PAD.r, -100]) {
    const { step, columns } = arenaBarColumns(2, width);
    assert.ok(Number.isFinite(step) && step > 0, `step was ${step} at width ${width}`);
    for (const column of columns)
      assert.ok(Number.isFinite(column.x) && Number.isFinite(column.midX), 'every coordinate stays finite');
  }
});

test('no bars means no columns, and no division by zero in the pitch', () => {
  const { step, columns } = arenaBarColumns(0, 600);
  assert.deepEqual(columns, []);
  assert.ok(Number.isFinite(step) && step > 0, `step was ${step}`);
});

test('one bar takes the whole plot width', () => {
  const { step, columns } = arenaBarColumns(1, 600);
  assert.equal(step, 600 - ARENA_PAD.l - ARENA_PAD.r);
  assert.equal(columns[0].midX, ARENA_PAD.l + step / 2);
});
