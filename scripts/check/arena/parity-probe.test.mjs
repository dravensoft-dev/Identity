/* The probe narrows check-parity to a few pairs, and a narrowed run that reports nothing is
 * indistinguishable from a full one that found nothing. Both guards below exist for that:
 * a name matching no pair is an error rather than a silent zero, and so is naming none. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPairs, summarize } from './parity-probe.mjs';

const CARD = { component: 'Card', layers: ['angular', 'react'], pages: {} };
const TAG = { component: 'Tag', layers: ['angular', 'react'], pages: {} };

test('selectPairs takes the pairs it was named, in the order they were named', () => {
  const { selected, problems } = selectPairs(['Tag', 'Card'], [CARD, TAG]);
  assert.deepEqual(problems, []);
  assert.deepEqual(selected.map((p) => p.component), ['Tag', 'Card']);
});

test('selectPairs refuses a name that matches no pair', () => {
  const { selected, problems } = selectPairs(['Crad'], [CARD, TAG]);
  assert.deepEqual(selected, []);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Crad/);
});

test('selectPairs refuses an empty selection, because a probe over nothing looks like a clean one', () => {
  const { problems } = selectPairs([], [CARD, TAG]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /nothing/);
});

test('the summary always names how many pairs went unlooked at, so it cannot read as the gate', () => {
  const text = summarize([], 1, 55);
  assert.match(text, /compared 1 of 55/);
  assert.match(text, /54 were not looked at/);
});

test('the summary says the same when the probe found a difference', () => {
  const text = summarize(['Card: 12 of 400 stage pixels differ'], 1, 55);
  assert.match(text, /Card: 12 of 400/);
  assert.match(text, /54 were not looked at/);
});
