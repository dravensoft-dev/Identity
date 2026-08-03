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

test('the check glyph reads its box and its stroke from tokens, never from a literal', () => {
  assert.deepEqual(CHECK_GLYPH_STYLE, { width: 'var(--sp-3)', height: 'var(--sp-3)' });
  assert.deepEqual(CHECK_STROKE_STYLE, { strokeWidth: 'var(--bw-strong)' });
});
