/* FORBIDDEN is asserted by literal value because it IS the rule -- a layer quietly dropped
 * from another's foreign set would leave the gate green over the coupling it exists to catch.
 * The lowercase cases matter as much: check:angular, test:react and build:tailwind are script
 * names every layer may write, and a case-insensitive token would have failed all three. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED,
  ALLOWED_SPECIFIERS,
  EXEMPT,
  FORBIDDEN,
  LAYER_TOKENS,
  collect,
  escapingSpecifiers,
  foreignTokens,
  isAllowedSpecifier,
  staleExemptions,
  textualHits,
} from './check-layer-independence.mjs';
import { LAYERS } from '../../lib/arena/layers.mjs';

test('the rule is the matrix: angular may name tailwind, and nothing else names anything', () => {
  assert.deepEqual(FORBIDDEN, {
    react: ['angular', 'tailwind'],
    angular: ['react'],
    tailwind: ['react', 'angular'],
  });
  assert.deepEqual(Object.keys(FORBIDDEN).sort(), [...LAYERS].sort());
  assert.deepEqual(Object.keys(LAYER_TOKENS).sort(), [...LAYERS].sort());
});

test('the one authorised edge is on the record with its reason', () => {
  assert.deepEqual([...ALLOWED.keys()], ['angular -> tailwind']);
  assert.match(ALLOWED.get('angular -> tailwind'), /manifest/);
});

test('a manifest module and the shared tv are the only specifiers that pass', () => {
  assert.ok(isAllowedSpecifier('frameworks/tailwind/components/display/tag/Tag.manifest.generated'));
  assert.ok(isAllowedSpecifier('frameworks/tailwind/Tv'));
  assert.equal(isAllowedSpecifier('frameworks/tailwind/Specimen.js'), false);
  assert.equal(isAllowedSpecifier('frameworks/react/components/forms/button/Button.jsx'), false);
  assert.equal(ALLOWED_SPECIFIERS.length, 2);
});

test('a citation of another layer is a hit, and a script name of any layer is not', () => {
  const tokens = foreignTokens('angular');
  assert.deepEqual(textualHits('bun run check:angular && bun run test:react', tokens), []);
  assert.equal(textualHits('matching React exactly', tokens).length, 1);
  assert.equal(textualHits('the same values Checkbox.jsx reads', tokens)[0].token, '.jsx');
});

test('tailwind may name neither sibling, and react may name neither either', () => {
  assert.equal(textualHits('an Angular primitive consumes this', foreignTokens('tailwind')).length, 1);
  assert.equal(textualHits('a PORT of frameworks/angular/FocusTrap.ts', foreignTokens('react')).length, 2);
});

test('an import is judged by where it LANDS, so the shared evaluator under scripts/ is not a hit', () => {
  const file = '/frameworks/react/test/AssertPattern.jsx';
  assert.deepEqual(escapingSpecifiers("import x from '../../../scripts/lib/core/behaviour-compliance.mjs';", file, 'react'), []);
  assert.deepEqual(escapingSpecifiers("import React from 'react';", file, 'react'), []);
});

test('EXEMPT is answerable to the real tree: every key it holds is matched, and none is dead', () => {
  assert.deepEqual(staleExemptions([...EXEMPT.keys()]), []);
  assert.deepEqual(staleExemptions([]).sort(), [...EXEMPT.keys()].sort());
  const { matchedKeys } = collect();
  assert.deepEqual(staleExemptions(matchedKeys), [],
    'an EXEMPT entry naming a file or token the tree no longer carries is a stale allowance');
});
