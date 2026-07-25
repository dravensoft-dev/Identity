/* Plan 8C2 turned every form control's native onChange into an event carrying a
 * VALUE rather than the DOM event -- string for Input, Select, Textarea and
 * RadioGroup, boolean for Checkbox, and Input's blur likewise. The six suites
 * under frameworks/react/test/ assert the SHAPE of that, and four of them say in
 * their own header that they cannot assert the event FIRES: renderToStaticMarkup
 * has no DOM. This file is that debt paid.
 *
 * Every test asserts the payload's TYPE before its value, and the order is
 * load-bearing. node:assert throws on the first failure, so a typeof assertion
 * placed second would never be reached once the equality assertion had already
 * failed -- and the whole point is to watch the TYPE assertion fail when a
 * component regresses to handing back the DOM event. Checkbox is the sharpest of
 * the six because boolean and "an event object" are unmistakably different
 * things; for the four string controls the type assertion is what states, in the
 * test itself, that `e.target.value` is not an acceptable stand-in for the value.
 *
 * ---------------------------------------------------------------------------
 * WHICH DOM EVENT DRIVES EACH CONTROL.
 *
 * These are real browser semantics -- ./preload.js installs the DOM before
 * react-dom evaluates, so React runs its normal event path rather than the legacy
 * change-detection polyfill it falls back to when it believes `input` is
 * unsupported. Each row below was measured against this harness.
 *
 *   Input       set the value through the native setter,
 *   Textarea    then dispatch 'input' (bubbles)          -> onChange
 *   Select      set the value, then dispatch 'change'    -> onChange
 *   Checkbox    element.click()                          -> onChange
 *   RadioGroup  element.click() on a child radio         -> onChange
 *   Input blur  element.focus(), then element.blur()     -> onBlur
 *
 * Two of those are worth explaining, and neither is a workaround.
 *
 * (1) Checkbox and radio are driven by 'click', not 'change'. That is React's
 * own choice in every browser, not something about this harness:
 * shouldUseClickEvent() in react-dom routes an <input type="checkbox"|"radio">
 * through getTargetInstForClickEvent, so a dispatched 'change' on one is
 * ignored outright. click() is also what a user does to a checkbox.
 *
 * (2) The value must be written through the prototype's own setter, not through
 * `el.value = x`. React installs a value tracker as an own property of the node
 * and skips an event whose value it believes it already knows; assigning through
 * that tracker updates its bookkeeping, so React concludes nothing changed and
 * the handler never runs. Going around it via the prototype descriptor is what
 * leaves the tracker stale, which is exactly what a real keystroke does. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from './harness.jsx';
import { Input } from '../components/forms/Input.jsx';
import { Checkbox } from '../components/forms/Checkbox.jsx';
import { Select } from '../components/forms/Select.jsx';
import { Textarea } from '../components/forms/Textarea.jsx';
import { RadioGroup } from '../components/forms/RadioGroup.jsx';
import { Radio } from '../components/forms/Radio.jsx';

afterEach(cleanup);

/** Write a value the way a keystroke does: through the element prototype's own
 *  setter, leaving React's instance-level value tracker stale so React agrees
 *  something changed. See note (2) in this file's header. */
function setNativeValue(el, next) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
  setter.call(el, next);
}

/** Type into a text-like control: change its value and emit the `input` event a
 *  browser emits for a keystroke. */
function typeInto(el, next) {
  act(() => {
    setNativeValue(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

test('Checkbox change hands the consumer a boolean, not the DOM event', () => {
  const seen = [];
  const root = mount(<Checkbox label="Notify" checked={false} onChange={(v) => seen.push(v)} />);
  const box = root.querySelector('input[type="checkbox"]');
  act(() => { box.click(); });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'boolean', 'the payload is not a boolean -- a DOM event is travelling');
  assert.equal(seen[0], true, 'the payload is not the new checked state');
});

test('Input change hands the consumer the string value, not the DOM event', () => {
  const seen = [];
  const root = mount(<Input label="Email" value="" onChange={(v) => seen.push(v)} />);
  typeInto(root.querySelector('input.arena-input'), 'ana@dravensoft.dev');
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'ana@dravensoft.dev', 'the payload is not the edited value');
});

test('Input blur hands the consumer the value, and validate runs on it', () => {
  const seen = [];
  const root = mount(
    <Input label="Email" value="nope" validate={(v) => (v.includes('@') ? '' : 'Bad email')}
      onBlur={(v) => seen.push(v)} />,
  );
  const field = root.querySelector('input.arena-input');
  act(() => { field.focus(); });
  act(() => { field.blur(); });
  assert.equal(seen.length, 1, 'the blur handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.deepEqual(seen, ['nope'], 'blur did not carry the value');
  assert.match(root.textContent, /Bad email/, 'validate did not run on blur');
});

test('Select change hands the consumer the chosen value as a string', () => {
  const seen = [];
  const root = mount(
    <Select label="Environment" value="prod"
      options={[{ value: 'prod', label: 'Production' }, { value: 'stage', label: 'Staging' }]}
      onChange={(v) => seen.push(v)} />,
  );
  const select = root.querySelector('select');
  act(() => {
    setNativeValue(select, 'stage');
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'stage', "the payload is not the chosen option's value");
});

test('Textarea change hands the consumer the new text as a string', () => {
  const seen = [];
  const root = mount(<Textarea label="Notes" value="" onChange={(v) => seen.push(v)} />);
  typeInto(root.querySelector('textarea'), 'Shipped on Friday.');
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'Shipped on Friday.', 'the payload is not the edited text');
});

test("RadioGroup change hands the consumer the selected option's value as a string", () => {
  const seen = [];
  const root = mount(
    <RadioGroup value="prod" name="env" onChange={(v) => seen.push(v)}>
      <Radio value="prod" label="Production" />
      <Radio value="stage" label="Staging" />
    </RadioGroup>,
  );
  const radios = root.querySelectorAll('input[type="radio"]');
  assert.equal(radios.length, 2, 'RadioGroup did not render one native radio per child');
  act(() => { radios[1].click(); });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'stage', "the payload is not the selected Radio's value");
});
