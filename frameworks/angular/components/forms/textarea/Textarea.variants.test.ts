/* No DOM and no TestBed: assertions about the recipe alone, plus the two derivations beside it.
 * `resize` is the inverse of `autoResize` and `state` has only two arms here -- there is no valid
 * state, because a Textarea has no validator to earn one. The near-limit counter is a second slot
 * rather than a variant, so which slot the component picks is the thing worth pinning. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTER_WARNING_SHARE, borderBoxSlack, counterIsNear, textareaIdFor } from './Textarea';
import { textareaStyles } from './Textarea.variants';

test('the default is a neutral, vertically resizable, enabled, editable field', () => {
  assert.equal(
    textareaStyles().field(),
    textareaStyles({ state: 'neutral', resize: 'vertical', disabled: false, readonly: false }).field(),
  );
});

test('neutral rings gold on focus and error rings at rest, the same as Input', () => {
  assert.match(textareaStyles({ state: 'neutral' }).field(), /focus:border-secondary/);
  assert.match(textareaStyles({ state: 'error' }).field(), /border-error/);
  assert.match(textareaStyles({ state: 'error' }).field(), /ring-error/);
});

test('there is no valid arm, because a Textarea has no validator to earn one', () => {
  assert.doesNotMatch(textareaStyles({ state: 'error' }).field(), /border-success/);
  assert.doesNotMatch(textareaStyles({ state: 'neutral' }).field(), /border-success/,
    'if a success border ever appears here the manifest grew a third arm, and the component '
    + 'derives only two -- it would then be reachable by nothing');
});

test('the field takes its focus ring directly, where Input takes it on a wrapping group', () => {
  const field = textareaStyles().field();
  assert.match(field, /focus:/);
  assert.doesNotMatch(field, /focus-within:/,
    'the textarea IS the field here -- there is no group around it for focus-within to catch');
});

test('resize is the inverse of autoResize, and both arms exist', () => {
  assert.match(textareaStyles({ resize: 'vertical' }).field(), /resize-y/);
  assert.match(textareaStyles({ resize: 'none' }).field(), /resize-none/);
});

test('disabled dims the group and readonly changes the surface and the cursor', () => {
  assert.match(textareaStyles({ disabled: true }).root(), /opacity-50/);
  assert.match(textareaStyles({ readonly: true }).field(), /bg-base-200/);
  assert.match(textareaStyles({ readonly: true }).field(), /cursor-default/);
});

test('the counter is mono micro-type, and its near-limit form is the warning colour', () => {
  assert.match(textareaStyles().counter(), /font-mono/);
  assert.match(textareaStyles().counter(), /text-base-content\/62/);
  assert.match(textareaStyles().counterNear(), /text-warning/);
});

test('the foot spreads the message and the counter to opposite ends', () => {
  assert.match(textareaStyles().foot(), /justify-between/);
});

test('counterIsNear turns over at nine tenths of the cap, exclusive', () => {
  assert.equal(COUNTER_WARNING_SHARE, 0.9);
  assert.equal(counterIsNear(89, 100), false);
  assert.equal(counterIsNear(90, 100), false, 'exactly at the share is not yet near -- Textarea.json contracts STRICTLY past nine tenths');
  assert.equal(counterIsNear(91, 100), true);
  assert.equal(counterIsNear(100, 100), true);
});

test('textareaIdFor derives the contracted ta- slug, which is a different prefix from Input\'s', () => {
  assert.equal(textareaIdFor('release-notes', 'Release notes'), 'release-notes');
  assert.equal(textareaIdFor(undefined, 'Release notes'), 'ta-release-notes');
  assert.equal(textareaIdFor(undefined, undefined), null);
});

test('the root carries a display utility, because the host binds it', () => {
  assert.match(textareaStyles().root(), /\bflex\b/);
  assert.match(textareaStyles().root(), /flex-col/);
});

test('borderBoxSlack is the border, which scrollHeight leaves out and a border-box height needs', () => {
  assert.equal(borderBoxSlack({ offsetHeight: 82, clientHeight: 80 } as HTMLElement), 2,
    'the Tailwind layer is border-box, so height must cover the border; scrollHeight covers only '
    + 'content plus padding, and the two-pixel shortfall is exactly one hairline top and bottom');
  assert.equal(borderBoxSlack({ offsetHeight: 80, clientHeight: 80 } as HTMLElement), 0);
});
