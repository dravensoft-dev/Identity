import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.tsx';
import { Input } from './input/Input.tsx';
import { Checkbox } from './checkbox/Checkbox.tsx';
import { Select } from './select/Select.tsx';
import { Textarea } from './textarea/Textarea.tsx';
import { RadioGroup } from './radio-group/RadioGroup.tsx';
import { Radio } from './radio/Radio.tsx';

afterEach(cleanup);

function setNativeValue(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, next: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!.set;
  setter!.call(el, next);
}

function typeInto(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, next: string) {
  act(() => {
    setNativeValue(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

test('Checkbox change hands the consumer a boolean, not the DOM event', () => {
  const seen: unknown[] = [];
  const root = mount(<Checkbox label="Notify" checked={false} onChange={(v) => seen.push(v)} />);
  const box = root.querySelector<HTMLElement>('input[type="checkbox"]');
  act(() => { box!.click(); });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'boolean', 'the payload is not a boolean -- a DOM event is travelling');
  assert.equal(seen[0], true, 'the payload is not the new checked state');
});

test('Input change hands the consumer the string value, not the DOM event', () => {
  const seen: unknown[] = [];
  const root = mount(<Input label="Email" value="" onChange={(v) => seen.push(v)} />);
  typeInto(root!.querySelector<HTMLInputElement>('input')!, 'ana@dravensoft.dev');
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'ana@dravensoft.dev', 'the payload is not the edited value');
});

test('Input blur hands the consumer the value, and validate runs on it', () => {
  const seen: unknown[] = [];
  const root = mount(
    <Input label="Email" value="nope" validate={(v) => (v.includes('@') ? '' : 'Bad email')}
      onBlur={(v) => seen.push(v)} />,
  );
  const field = root.querySelector<HTMLInputElement>('input');
  act(() => { field!.focus(); });
  act(() => { field!.blur(); });
  assert.equal(seen.length, 1, 'the blur handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.deepEqual(seen, ['nope'], 'blur did not carry the value');
  assert.match(root.textContent, /Bad email/, 'validate did not run on blur');
});

test('Select change hands the consumer the chosen value as a string', () => {
  const seen: unknown[] = [];
  const root = mount(
    <Select label="Environment" value="prod"
      options={[{ value: 'prod', label: 'Production' }, { value: 'stage', label: 'Staging' }]}
      onChange={(v) => seen.push(v)} />,
  );
  const select = root.querySelector<HTMLSelectElement>('select');
  act(() => {
    setNativeValue(select!, 'stage');
    select!.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'stage', "the payload is not the chosen option's value");
});

test('Textarea change hands the consumer the new text as a string', () => {
  const seen: unknown[] = [];
  const root = mount(<Textarea label="Notes" value="" onChange={(v) => seen.push(v)} />);
  typeInto(root!.querySelector<HTMLTextAreaElement>('textarea')!, 'Shipped on Friday.');
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'Shipped on Friday.', 'the payload is not the edited text');
});

test("RadioGroup change hands the consumer the selected option's value as a string", () => {
  const seen: unknown[] = [];
  const root = mount(
    <RadioGroup ariaLabel="Deployment target" value="prod" name="env" onChange={(v) => seen.push(v)}>
      <Radio value="prod" label="Production" />
      <Radio value="stage" label="Staging" />
    </RadioGroup>,
  );
  const radios = root.querySelectorAll<HTMLElement>('input[type="radio"]');
  assert.equal(radios.length, 2, 'RadioGroup did not render one native radio per child');
  act(() => { radios[1]!.click(); });
  assert.equal(seen.length, 1, 'the change handler did not fire');
  assert.equal(typeof seen[0], 'string', 'the payload is not a string -- a DOM event is travelling');
  assert.equal(seen[0], 'stage', "the payload is not the selected Radio's value");
});
