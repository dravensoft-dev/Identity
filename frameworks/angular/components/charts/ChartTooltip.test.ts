import test from 'node:test';
import assert from 'node:assert/strict';
import { arenaTooltipAnchor } from './ChartTooltip';

test('the tooltip sits over the mark it reads, on the mark\'s own x', () => {
  assert.equal(arenaTooltipAnchor(120, 40).left, 120);
});

test('the tooltip clears the mark by the token, never by a number a chart picked', () => {

  assert.equal(arenaTooltipAnchor(120, 40).top, 'calc(40px - var(--chart-tooltip-offset))');
});

test('both charts anchor identically, which is the whole reason this is one function', () => {
  assert.deepEqual(arenaTooltipAnchor(0, 0), arenaTooltipAnchor(0, 0));
  assert.equal(arenaTooltipAnchor(7.5, 12.25).top, 'calc(12.25px - var(--chart-tooltip-offset))');
});

test('a mark at the plot ceiling still anchors above itself, and CSS is what clamps it', () => {

  assert.equal(arenaTooltipAnchor(10, 0).top, 'calc(0px - var(--chart-tooltip-offset))');
});
