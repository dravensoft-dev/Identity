/* The three state requirements of `textbox` are BEHAVIOURAL: no snapshot decides
 * them, because a control that is correctly editable carries no readonly marker
 * at all. So each verdict below is earned by rendering BOTH polarities and
 * asserting the reflection tracks the member -- a suite that rendered only the
 * readonly one could not tell a component that reflects the state from one that
 * hardcodes it. Native readonly/required/multiline map to their ARIA states, so
 * the assertions read the native attributes rather than aria-* mirrors. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup } from '../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.tsx';
import { Input } from './input/Input.tsx';
import { Textarea } from './textarea/Textarea.tsx';

afterEach(cleanup);

const INPUT_BINDING = join(REACT_COMPONENTS, 'forms/input/Input.behaviour.json');
const TEXTAREA_BINDING = join(REACT_COMPONENTS, 'forms/textarea/Textarea.behaviour.json');

function reflects(render: (v: boolean) => React.ReactElement, selector: string, attribute: string) {
  const on = mount(render(true)).querySelector(selector);
  assert.equal(on!.hasAttribute(attribute), true,
    `the control does not carry ${attribute} when the member says it should`);
  const off = mount(render(false)).querySelector(selector);
  assert.equal(off!.hasAttribute(attribute), false,
    `the control carries ${attribute} while editable, so it is hardcoded rather than reflected`);
  return on;
}

test('Input reflects readonly and required, and is a single-line textbox', () => {
  reflects((v: boolean) => <Input label="Project" readOnly={v} />, 'input', 'readonly');
  reflects((v: boolean) => <Input label="Project" required={v} />, 'input', 'required');

  const root = mount(<Input label="Project" readOnly />);
  const el = root.querySelector<HTMLInputElement>('input');
  assert.equal(el!.hasAttribute('aria-multiline'), false,
    'the element type is the reflection here, so an explicit aria-multiline would be redundant');
  assert.ok(root.querySelector<HTMLElement>('label[for="' + el!.getAttribute('id') + '"]')!,
    'the name comes from a <label for>, which is the route roles.label has to resolve');

  assertPattern({
    root,
    bindingPath: INPUT_BINDING,
    subjects: { default: el },
    behavioural: { 'states.readonly': true, 'states.required': true },
  });
});

test('Textarea reflects readonly and required, and is a multi-line textbox', () => {
  reflects((v: boolean) => <Textarea label="Notes" readOnly={v} />, 'textarea', 'readonly');
  reflects((v: boolean) => <Textarea label="Notes" required={v} />, 'textarea', 'required');

  const root = mount(<Textarea label="Notes" readOnly />);
  const el = root.querySelector<HTMLTextAreaElement>('textarea');
  assert.equal(el!.tagName, 'TEXTAREA',
    'multiline is carried by the element itself, which is why no aria-multiline is authored');
  assert.ok(root.querySelector<HTMLElement>('label[for="' + el!.getAttribute('id') + '"]')!,
    'the name comes from a <label for>, which is the route roles.label has to resolve');

  assertPattern({
    root,
    bindingPath: TEXTAREA_BINDING,
    subjects: { default: el },
    behavioural: { 'states.readonly': true, 'states.required': true },
  });
});
