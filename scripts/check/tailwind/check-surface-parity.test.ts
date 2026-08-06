/* The gate reads two real manifests; these drive its pure functions with the drift a real
 * change would produce, since the pair it guards agrees today by construction. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAIRS, SURFACE, surfaceClasses, slotClasses, parityProblems } from './check-surface-parity.ts';

const CARD = { slots: { root: 'block bg-base-200 border-[length:var(--bw)] rounded-lg overflow-hidden' },
  variants: { accent: { false: { root: 'border-base-300' } } } };
const UNAUTH = { slots: { panel: 'bg-base-200 border-[length:var(--bw)] border-base-300 rounded-lg overflow-hidden shadow-3 p-5' } };
const read = (file) => (file.includes('card/ArenaCard') ? CARD : UNAUTH);

test('surfaceClasses keeps background, border and radius and drops everything else', () => {
  assert.deepEqual(surfaceClasses('block bg-base-200 rounded-lg p-5 shadow-3 overflow-hidden'),
    ['bg-base-200', 'rounded-lg']);
  assert.deepEqual(SURFACE, ['bg-', 'border-', 'rounded-']);
});

test('a variant contributes to the slot it names, which is where ArenaCard keeps its border colour', () => {
  assert.match(slotClasses(CARD, 'root', ['accent', 'false']), /border-base-300/);
  assert.doesNotMatch(slotClasses(CARD, 'root'), /border-base-300/);
});

test('the two surfaces agree today, and padding differing is not a problem', () => {
  assert.deepEqual(parityProblems(PAIRS, read), []);
});

test('a radius changed on one side is caught, which is the scenario the record predicted', () => {
  const drifted = { ...CARD, slots: { root: CARD.slots.root.replace('rounded-lg', 'rounded-md') } };
  const problems = parityProblems(PAIRS, (f) => (f.includes('card/ArenaCard') ? drifted : UNAUTH));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /rounded-lg/);
  assert.match(problems[0], /rounded-md/);
});

test('a side with no surface class at all fails rather than comparing nothing', () => {
  const empty = { slots: { root: 'block overflow-hidden' }, variants: {} };
  const problems = parityProblems(PAIRS, (f) => (f.includes('card/ArenaCard') ? empty : UNAUTH));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /compared nothing/);
});
