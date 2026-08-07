/* Moved here with the two functions, from the gate that exported them. The claims are the ones
 * the browser gate needs and any caller would: a result stays at its input index however the
 * calls settled, the bound is reached and never exceeded, and the interleave is a permutation
 * that pulls originally-adjacent items apart. The scale in the third is the card gate's real
 * one, kept because a spread that only holds for twelve items proves nothing about fifty. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { interleaveForDispatch, mapWithConcurrency } from './concurrency.ts';

test('mapWithConcurrency keeps results in filename order even when a later file answers first', async () => {
  const files = ['a.html', 'b.html', 'c.html', 'd.html'];
  const delayMs: Record<string, number> = { 'a.html': 120, 'b.html': 5, 'c.html': 80, 'd.html': 35 };
  const completions: string[] = [];

  const results = await mapWithConcurrency(files, 4, async (file: string) => {
    await new Promise((r) => setTimeout(r, delayMs[file]));
    completions.push(file);
    return { file, status: 'ok' };
  });

  assert.deepEqual(completions, ['b.html', 'd.html', 'c.html', 'a.html'], 'sanity check: the calls really did settle out of filename order');
  assert.deepEqual(results.map((r) => r.file), files, 'results stay in filename order regardless of which call settled first');
});

test('mapWithConcurrency never runs more than `limit` calls at once', async () => {
  let inFlight = 0;
  let peak = 0;
  const items = Array.from({ length: 10 }, (_, i) => i);

  await mapWithConcurrency(items, 3, async (i) => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, 10));
    inFlight -= 1;
    return i;
  });

  assert.ok(peak <= 3, `peak concurrency was ${peak}, expected at most 3`);
  assert.equal(peak, 3, 'sanity check: the bound is actually reached, not just never exceeded');
});

test('interleaveForDispatch reads a row-major grid back out column-major', () => {
  const items = Array.from({ length: 12 }, (_, i) => i);
  const out = interleaveForDispatch(items, 4);

  assert.deepEqual(out, [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11]);
});

test('interleaveForDispatch spreads originally-adjacent items out of the first wave, at this file\'s real scale', () => {
  const items = Array.from({ length: 45 }, (_, i) => i);
  const groups = 5;
  const out = interleaveForDispatch(items, groups);
  const positionOf = new Map(out.map((item, pos) => [item, pos]));

  for (const item of [0, 1, 2, 3]) assert.ok(positionOf.has(item));
  const positions = [0, 1, 2, 3].map((item) => positionOf.get(item) ?? -1);

  for (let a = 0; a < positions.length; a += 1) {
    for (let b = a + 1; b < positions.length; b += 1) {
      assert.ok(Math.abs((positions[a] ?? 0) - (positions[b] ?? 0)) >= groups, `items ${a} and ${b} landed too close: positions ${positions[a]} and ${positions[b]}`);
    }
  }
});

test('interleaveForDispatch is a permutation — every item appears exactly once', () => {
  const items = ['a.html', 'b.html', 'c.html', 'd.html', 'e.html'];
  const out = interleaveForDispatch(items, 3);
  assert.deepEqual([...out].sort(), [...items].sort());
  assert.equal(out.length, items.length);
});
