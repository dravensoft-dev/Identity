/* The claims that made unifying four implementations into three functions safe. The one that
 * matters is the digit: `scriptName` lifted it and `camel` did not, and the wider class is
 * kept, so `sp-4` keeps answering `sp4` where a token name needs it. `pascal` and `kebab` are
 * inverses over a name with no digit boundary, and the case where they are not is here too,
 * because a round trip that quietly loses a hyphen is how a directory name stops resolving. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { camel, kebab, pascal } from './case.ts';

test('camel lifts a letter and a digit after a hyphen, which is what a token name needs', () => {
  assert.equal(camel('chart-pad-left'), 'chartPadLeft');
  assert.equal(camel('chart-height'), 'chartHeight');
  assert.equal(camel('sp-4'), 'sp4',
    'the narrower class left this as sp-4, and generate-tokens writes the name a script reads');
  assert.equal(camel('margin-top'), 'marginTop');
});

test('camel trims, because one of the two it replaces was handed a captured run', () => {
  assert.equal(camel('  grid-column  '), 'gridColumn');
});

test('pascal lifts the first letter and every one after a hyphen', () => {
  assert.equal(pascal('arena-button'), 'ArenaButton');
  assert.equal(pascal('arena-bar-chart'), 'ArenaBarChart');
  assert.equal(pascal('forms'), 'Forms');
});

test('kebab is the inverse of pascal, first letter included', () => {
  assert.equal(kebab('ArenaButton'), 'arena-button');
  assert.equal(kebab('ArenaBarChart'), 'arena-bar-chart');
  for (const name of ['ArenaButton', 'ArenaBarChart', 'ArenaTag'])
    assert.equal(pascal(kebab(name)), name, `${name} does not survive the round trip`);
});

test('kebab is not the inverse of camel, and the difference is the first letter', () => {
  assert.equal(camel(kebab('ArenaButton')), 'arenaButton',
    'camel leaves the first letter alone, so a component name goes through pascal and never here');
});
