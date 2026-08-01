/* Five controls whose bindings claimed a pattern with nothing rendering them.
 * Each pattern's keyboard clause belongs to the PLATFORM here -- a native
 * <button> answers Enter and Space, a native checkbox answers Space -- so what is
 * asserted is that Arena does not INTERCEPT the key, the same honesty the
 * radiogroup and Menu suites use. Dispatching a key happy-dom will not turn into
 * a click would prove nothing either way. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../test/AssertPattern.tsx';
import { Button } from './button/Button.tsx';
import { IconButton } from './icon-button/IconButton.tsx';
import { Checkbox } from './checkbox/Checkbox.tsx';
import { Select } from './select/Select.tsx';
import { Switch } from './switch/Switch.tsx';

afterEach(cleanup);

function assertKeysUnintercepted(el: Element, keys: string[]) {
  for (const key of keys) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => { el.dispatchEvent(event); });
    assert.equal(event.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the control's own activation`);
  }
}

test('Button is a real button that names itself by its own text', () => {
  const root = mount(<Button onClick={() => {}}>Deploy</Button>);
  const el = root.querySelector<HTMLElement>('button');
  assert.equal(el!.textContent.trim(), 'Deploy', 'the button pattern accepts text content as the name');
  assertKeysUnintercepted(el!, ['Enter', ' ']!);

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'forms/button/Button.behaviour.json'),
    subjects: { default: el },
    behavioural: { 'keyboard.Enter': true, 'keyboard.Space': true, 'states.disabled': true },
  });
});

test('Button reflects disabled natively, and the reflection tracks the member', () => {
  const off = mount(<Button disabled onClick={() => {}}>Deploy</Button>).querySelector<HTMLElement>('button');
  assert.equal(off!.hasAttribute('disabled'), true, 'a disabled button must be disabled');
  cleanup();
  const on = mount(<Button onClick={() => {}}>Deploy</Button>).querySelector<HTMLElement>('button');
  assert.equal(on!.hasAttribute('disabled'), false, 'an enabled button must carry nothing, or it is hardcoded');
});

test('IconButton is named by aria-label, since it draws no text', () => {
  const root = mount(<IconButton icon="ph-bold ph-plus" label="New project" onClick={() => {}} />);
  const el = root.querySelector<HTMLElement>('button');
  assert.equal(el!.getAttribute('aria-label'), 'New project',
    'an icon-only control has no text to be named by, so the label member is the only route');
  assertKeysUnintercepted(el!, ['Enter', ' ']!);

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'forms/icon-button/IconButton.behaviour.json'),
    subjects: { default: el },
    behavioural: { 'keyboard.Enter': true, 'keyboard.Space': true, 'states.disabled': true },
  });
});

test('Checkbox is a native checkbox whose checked state is the platform’s', () => {
  const root = mount(<Checkbox label="Notify the team" checked onChange={() => {}} />);
  const el = root.querySelector<HTMLElement>('input[type="checkbox"]');
  assert.equal((el as HTMLInputElement).checked, true, 'the fixture must render the checked state it claims');
  assertKeysUnintercepted(el!, [' ']!);

  const off = mount(<Checkbox label="Notify the team" onChange={() => {}} />)
    .querySelector<HTMLElement>('input[type="checkbox"]');
  assert.equal((off as HTMLInputElement).checked, false, 'the state must track the member rather than being hardcoded');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'forms/checkbox/Checkbox.behaviour.json'),
    subjects: { default: el },
    behavioural: { 'keyboard.Space': true },
  });
});

test('Switch reports as a switch and reflects its own state', () => {
  const root = mount(<Switch label="Automatic deploys" state onRequestChange={() => {}} />);
  const el = root.querySelector<HTMLElement>('[role="switch"]');
  assert.ok(el, 'a switch that reports as a checkbox loses the immediate-effect meaning');
  assert.equal(el.getAttribute('aria-checked'), 'true');
  assertKeysUnintercepted(el, [' ']!);

  const off = mount(<Switch label="Automatic deploys" onRequestChange={() => {}} />)
    .querySelector<HTMLElement>('[role="switch"]');
  assert.equal(off!.getAttribute('aria-checked'), 'false',
    'the state must track the member rather than being hardcoded');

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'forms/switch/Switch.behaviour.json'),
    subjects: { default: el },
    behavioural: { 'keyboard.Space': true },
  });
});

test('Select is a native select: the browser owns the popup, the author owns the name', () => {
  const root = mount(
    <Select label="Environment" value="staging" onChange={() => {}}
      options={[{ value: 'production', label: 'Production' }, { value: 'staging', label: 'Staging' }]} />,
  );
  const el = root.querySelector<HTMLSelectElement>('select');
  assert.ok(el, 'the control here is a native <select>, not an authored popup');
  assert.equal(el.options.length, 2, 'one option per entry');
  assertKeysUnintercepted(el, ['ArrowDown', 'Enter', 'Escape']!);

  const label = root.querySelector<HTMLElement>(`label[for="${el.getAttribute('id')}"]`);
  assert.ok(label, 'the label must be ASSOCIATED with the control, not merely drawn above it');
  assert.equal(label.textContent.trim(), 'Environment');

  for (const attr of ['aria-expanded', 'aria-controls', 'aria-activedescendant']) {
    assert.equal(el.hasAttribute(attr), false,
      `${attr} on a native select is a claim about a popup the browser owns and the component cannot keep true`);
  }

  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'forms/select/Select.behaviour.json'),
    subjects: { default: el },
  });
});
