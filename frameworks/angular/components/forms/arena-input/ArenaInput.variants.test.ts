/* No DOM and no TestBed: assertions about the recipe alone, plus the id builder beside it.
 * `state` is derived rather than a prop -- the component crosses `error`, `valid` and the
 * validator's own verdict into one of three arms -- so what this file pins is which arm looks
 * like what, and the component's suite pins which arm it picks. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { inputIdFor } from './ArenaInput';
import { arenaInputStyles } from './ArenaInput.variants';

test('the default is a neutral, enabled, editable field', () => {
  assert.equal(
    arenaInputStyles().field(),
    arenaInputStyles({ state: 'neutral', disabled: false, readonly: false }).field(),
  );
});

test('inputIdFor prefers an explicit id and otherwise derives the contracted in- slug', () => {
  assert.equal(inputIdFor('project-name', 'Project name'), 'project-name');
  assert.equal(inputIdFor(undefined, 'Project name'), 'in-project-name');
  assert.equal(inputIdFor(undefined, 'Repository   URL'), 'in-repository-url');
  assert.equal(inputIdFor(undefined, undefined), null,
    'with neither, the label has nothing to point at and the attribute must be absent rather than empty');
});
