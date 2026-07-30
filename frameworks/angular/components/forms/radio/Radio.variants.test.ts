/* No DOM and no TestBed: assertions about the recipe alone. Radio and RadioGroup read ONE
 * manifest -- `Radio.manifest.json` carries the group's slot as well as the option's -- so this
 * file covers the option and RadioGroup.variants.test.ts covers the group. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { radioStyles } from './Radio.variants';

test('the default is an unchecked, enabled option', () => {
  assert.equal(radioStyles().root(), radioStyles({ checked: false, disabled: false }).root());
});

test('the ring changes only its border on selection, so the box never moves', () => {
  assert.match(radioStyles({ checked: true }).ring(), /border-primary/);
  assert.match(radioStyles({ checked: false }).ring(), /border-neutral/);
  for (const checked of [true, false]) {
    const ring = radioStyles({ checked }).ring();
    assert.match(ring, /bg-base-300/, `checked=${checked} changed the ring surface`);
    assert.match(ring, /size-5/, `checked=${checked} changed the ring size`);
  }
});

test('the ring and the dot are both pills, which is what makes a radio not a checkbox', () => {
  assert.match(radioStyles().ring(), /rounded-pill/);
  assert.match(radioStyles().dot(), /rounded-pill/);
});

test('the dot is the brand, and it is the only crimson in the control', () => {
  assert.match(radioStyles().dot(), /bg-primary/);
});

test('disabled dims the whole option and takes the pointer away; enabled offers it', () => {
  assert.match(radioStyles({ disabled: true }).root(), /opacity-50/);
  assert.match(radioStyles({ disabled: true }).root(), /cursor-not-allowed/);
  assert.match(radioStyles({ disabled: false }).root(), /cursor-pointer/);
});

test('the option aligns to the top of its text, because a hint makes it two lines tall', () => {
  assert.match(radioStyles().root(), /items-start/);
  assert.match(radioStyles().ring(), /shrink-0/);
});

test('the label and the hint are two type levels, not one with an opacity', () => {
  assert.match(radioStyles().label(), /text-ctl\b/);
  assert.match(radioStyles().hint(), /text-ctl-sm/);
  assert.match(radioStyles().label(), /text-base-content\/82/);
  assert.match(radioStyles().hint(), /text-base-content\/62/);
});

test('the native input is hidden by the recipe rather than by display:none, so it stays focusable', () => {
  const input = radioStyles().input();
  assert.match(input, /opacity-0/);
  assert.match(input, /size-0/);
  assert.doesNotMatch(input, /\bhidden\b/,
    'display:none would take the option out of the tab order the browser roves for us');
});
