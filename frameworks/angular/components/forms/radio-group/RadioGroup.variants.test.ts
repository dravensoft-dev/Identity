/* No DOM and no TestBed. The group reads the same `Radio.manifest.json` its options do, which is
 * why there is no RadioGroup manifest to look for -- the family shares one recipe, and the group
 * uses exactly one slot of it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { radioGroupStyles } from './RadioGroup.variants';
import { radioStyles } from '../radio/Radio.variants';

test('the group is a column, and it is a display utility because the host binds it', () => {
  const group = radioGroupStyles().group();
  assert.match(group, /\bflex\b/);
  assert.match(group, /flex-col/);
  assert.match(group, /gap-3/);
});

test('the group and its options resolve from one recipe, so their spacing cannot drift apart', () => {
  assert.equal(radioGroupStyles().group(), radioStyles().group());
});

test('the group carries no selection state of its own -- that lives on each option', () => {
  assert.equal(radioGroupStyles({ checked: true }).group(), radioGroupStyles({ checked: false }).group());
});
