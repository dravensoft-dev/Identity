/* No DOM and no TestBed: assertions about the recipe alone. The check glyph's own geometry is
 * not in the manifest -- it is the two camelCase style objects the component exports, the same
 * shape and the same reason as the three SVG charts, and they are asserted here beside it. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECK_GLYPH_STYLE, CHECK_STROKE_STYLE } from './Checkbox';
import { checkboxStyles } from './Checkbox.variants';

test('the default is an unchecked, enabled box', () => {
  assert.equal(
    checkboxStyles().root(),
    checkboxStyles({ checked: false, disabled: false }).root(),
  );
});

test('checked fills with the brand; unchecked is the input surface behind a neutral hairline', () => {
  const on = checkboxStyles({ checked: true }).box();
  assert.match(on, /bg-primary/);
  assert.match(on, /border-primary/);

  const off = checkboxStyles({ checked: false }).box();
  assert.match(off, /bg-base-300/);
  assert.match(off, /border-neutral/);
});

test('the tick reads on the filled box, which is the one pairing that has to hold', () => {
  assert.match(checkboxStyles({ checked: true }).check(), /text-primary-content/);
});

test('disabled dims the whole control and takes the pointer away; enabled offers it', () => {
  assert.match(checkboxStyles({ disabled: true }).root(), /opacity-50/);
  assert.match(checkboxStyles({ disabled: true }).root(), /cursor-not-allowed/);
  assert.match(checkboxStyles({ disabled: false }).root(), /cursor-pointer/);
});

test('the native input is hidden by the recipe rather than by display:none, so it stays focusable', () => {
  const input = checkboxStyles().input();
  assert.match(input, /opacity-0/);
  assert.match(input, /size-0/);
  assert.doesNotMatch(input, /\bhidden\b/,
    'display:none would take the control out of the accessibility tree and out of the Tab order');
});

test('the box keeps its geometry through the merge, in both states', () => {
  for (const checked of [true, false]) {
    const box = checkboxStyles({ checked }).box();
    assert.match(box, /size-5/, `checked=${checked} lost the box size`);
    assert.match(box, /rounded-xs/, `checked=${checked} lost its radius`);
    assert.match(box, /inline-flex/, `checked=${checked} lost its display utility`);
  }
});

test('the check glyph reads its box and its stroke from tokens, never from a literal', () => {
  assert.deepEqual(CHECK_GLYPH_STYLE, { width: 'var(--sp-3)', height: 'var(--sp-3)' });
  assert.deepEqual(CHECK_STROKE_STYLE, { strokeWidth: 'var(--bw-strong)' });
});
