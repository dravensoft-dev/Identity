/* No DOM and no TestBed: assertions about the recipe alone, plus the id builder beside it.
 * `state` is derived rather than a prop -- the component crosses `error`, `valid` and the
 * validator's own verdict into one of three arms -- so what this file pins is which arm looks
 * like what, and the component's suite pins which arm it picks. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { inputIdFor } from './Input';
import { inputStyles } from './Input.variants';

test('the default is a neutral, enabled, editable field', () => {
  assert.equal(
    inputStyles().field(),
    inputStyles({ state: 'neutral', disabled: false, readonly: false }).field(),
  );
});

test('neutral rings gold only on focus; error and valid ring at rest and say which they are', () => {
  const neutral = inputStyles({ state: 'neutral' }).field();
  assert.match(neutral, /focus-within:border-secondary/);
  assert.doesNotMatch(neutral, /(?<!focus-within:)\bring-secondary/,
    'a resting neutral field must not already be ringed');

  const error = inputStyles({ state: 'error' });
  assert.match(error.field(), /border-error/);
  assert.match(error.field(), /ring-error/);
  assert.match(error.statusIcon(), /text-error/);

  const valid = inputStyles({ state: 'valid' });
  assert.match(valid.field(), /border-success/);
  assert.match(valid.statusIcon(), /text-success/);
});

test('a valid field still takes the focus ring, because being valid is not being focused', () => {
  assert.match(inputStyles({ state: 'valid' }).field(), /focus-within:border-secondary/);
});

test('the focus ring is the recipe\'s job, not the component\'s -- there is no focus signal to keep', () => {
  assert.match(inputStyles().field(), /focus-within:/,
    'if this moved to a JS state the component would hold focus twice, in the DOM and in a signal');
});

test('disabled dims the whole field group and readonly changes the surface, not the border', () => {
  assert.match(inputStyles({ disabled: true }).root(), /opacity-50/);
  assert.match(inputStyles({ readonly: true }).field(), /bg-base-200/);
  assert.match(inputStyles({ readonly: true }).input(), /cursor-default/);
});

test('the required marker is the brand, so a label reads as required without the word', () => {
  assert.match(inputStyles().required(), /text-primary/);
});

test('the label is the mono uppercase micro-label, which is the field-label treatment', () => {
  const label = inputStyles().label();
  assert.match(label, /font-mono/);
  assert.match(label, /uppercase/);
  assert.match(label, /tracking-field-label/);
});

test('the date picker indicator is dressed from --picker-invert, so it flips with the theme', () => {
  const control = inputStyles().input();
  assert.match(control, /\[&::-webkit-calendar-picker-indicator\]:\[filter:invert\(var\(--picker-invert\)\)\]/,
    'without this the browser draws a black glyph on a dark field');
  assert.match(control, /\[&::-webkit-calendar-picker-indicator\]:opacity-60/);
  assert.match(control, /hover:\[&::-webkit-calendar-picker-indicator\]:opacity-100/);
});

test('the root carries a display utility, because the host binds it', () => {
  assert.match(inputStyles().root(), /\bflex\b/);
  assert.match(inputStyles().root(), /flex-col/);
});

test('inputIdFor prefers an explicit id and otherwise derives React\'s exact in- slug', () => {
  assert.equal(inputIdFor('project-name', 'Project name'), 'project-name');
  assert.equal(inputIdFor(undefined, 'Project name'), 'in-project-name');
  assert.equal(inputIdFor(undefined, 'Repository   URL'), 'in-repository-url');
  assert.equal(inputIdFor(undefined, undefined), null,
    'with neither, the label has nothing to point at and the attribute must be absent rather than empty');
});
