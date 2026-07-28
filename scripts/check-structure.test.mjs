/* check:structure asserts that every framework layer places a component
 * directory in the category frameworks/Components.json assigns it. It does
 * NOT assert the category is the right one -- that is editorial judgement and
 * no gate has it. A green run is a consistency claim, never a taxonomy one. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStructure, MIGRATED } from './check-structure.mjs';

const categories = { display: ['Badge', 'Tag'], forms: ['Button'] };

test('a tree that matches the declaration has no problems', () => {
  const layers = { tailwind: { display: ['badge', 'tag'], forms: ['button'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

test('a component in the wrong category is named, with both categories', () => {
  const layers = { tailwind: { forms: ['badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Badge/);
  assert.match(problems[0], /forms/);
  assert.match(problems[0], /display/);
});

test('a directory no category declares is a problem', () => {
  const layers = { tailwind: { display: ['badge', 'sparkline'] } };
  const problems = validateStructure({ categories, layers });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /sparkline/);
});

test('a layer carrying only some categories is fine -- Angular has no forms/', () => {
  const layers = { angular: { display: ['tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), []);
});

test('a declared component missing from every layer is a problem once every layer is in', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  const problems = validateStructure({ categories, layers, complete: true });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Button/);
});

test('the same tree is clean while layers are still unmigrated', () => {
  const layers = { tailwind: { display: ['badge', 'tag'] } };
  assert.deepEqual(validateStructure({ categories, layers }), [],
    'a component absent from the migrated layers may simply live in one this gate does not yet reach');
});

test('a directory that is not kebab-case is a problem, even in the right category', () => {
  const layers = { tailwind: { display: ['Badge'] } };
  const problems = validateStructure({ categories, layers });
  assert.ok(problems.some((p) => /Badge/.test(p) && /kebab/.test(p)));
});

test('MIGRATED names the layers this gate currently reaches', () => {
  assert.deepEqual(MIGRATED, ['tailwind']);
});
