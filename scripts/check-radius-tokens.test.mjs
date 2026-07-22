import test from 'node:test';
import assert from 'node:assert/strict';
import { hasRoundedFull, evaluateManifest, collect } from './check-radius-tokens.mjs';

test('a plain class string carries no rounded-full', () => {
  assert.equal(hasRoundedFull('size-5 rounded-pill bg-base-300'), false);
});

test('rounded-full is detected', () => {
  assert.equal(hasRoundedFull('size-10 rounded-full'), true);
});

test('rounded-pill does not false-positive as rounded-full', () => {
  assert.equal(hasRoundedFull('inline-flex rounded-pill'), false);
});

test('a word-boundary near-miss does not false-positive', () => {
  // No real Tailwind class looks like this, but the regex must still be
  // anchored on both sides the way check-manifest-states.mjs's stateFamilies
  // is, rather than matching a rounded-full substring inside a longer token.
  assert.equal(hasRoundedFull('not-rounded-full-ish'), false);
});

test('evaluateManifest flags a slot in `slots`', () => {
  const manifest = { component: 'Fixture', slots: { dot: 'size-1.5 rounded-full bg-current' } };
  assert.deepEqual(evaluateManifest(manifest), [{ component: 'Fixture', slot: 'dot' }]);
});

test('evaluateManifest flags a slot only reached through a variant branch', () => {
  const manifest = {
    component: 'Fixture',
    slots: { root: 'inline-flex' },
    variants: { shape: { circle: { root: 'rounded-full' } } },
  };
  assert.deepEqual(evaluateManifest(manifest), [{ component: 'Fixture', slot: 'root' }]);
});

test('evaluateManifest reports nothing for a clean manifest', () => {
  const manifest = { component: 'Fixture', slots: { root: 'rounded-pill bg-primary' } };
  assert.deepEqual(evaluateManifest(manifest), []);
});

test('the real manifest tree carries no rounded-full -- the six known offenders are fixed', () => {
  assert.deepEqual(collect(), []);
});
