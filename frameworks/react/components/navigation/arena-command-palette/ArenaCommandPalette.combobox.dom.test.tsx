/* roles.controls and roles.activedescendant are IDREF requirements with
 * match: 'every', so the evaluator RESOLVES them against the render root and a
 * dangling id counts as unmet -- which is why the active-descendant id is emitted
 * only while the index is in range. The empty-result render is the case that
 * would dangle, and it is asserted here rather than left to the evaluator. */
import type { ArenaCommand } from '../../../Api.generated';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.tsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.tsx';
import { ArenaCommandPalette } from './ArenaCommandPalette.tsx';

afterEach(cleanup);

const BINDING = join(REACT_COMPONENTS, 'navigation/arena-command-palette/ArenaCommandPalette.behaviour.json');

const COMMANDS = [
  { id: 'deploy', label: 'Deploy to production', shortcut: '⌘D' },
  { id: 'rollback', label: 'Roll back the last release' },
  { id: 'invite', label: 'Invite a teammate', hint: 'people' },
];

function press(el: Element, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { el.dispatchEvent(event); });
  return event;
}

function render(extra: Record<string, unknown> = {}) {
  const root = mount(<ArenaCommandPalette open commands={COMMANDS} onClose={() => {}} onRun={() => {}} {...extra} />);
  return { root, input: root.querySelector<HTMLElement>('[role="combobox"]')!, options: [...root.querySelectorAll<HTMLElement>('[role="option"]')] };
}

test('the search field is a combobox that names the row it is on', () => {
  const { root, input, options } = render();
  assert.ok(input, 'the input carried no role at all before this');
  assert.equal(input.getAttribute('aria-expanded'), 'true');

  const listbox = root.querySelector<HTMLElement>('[role="listbox"]');
  assert.ok(listbox, 'aria-controls must point at a real listbox, not at nothing');
  assert.equal(input.getAttribute('aria-controls'), listbox.getAttribute('id'),
    'aria-controls must resolve inside the render, or the evaluator counts it unmet');

  assert.equal(options.length, COMMANDS.length, 'one option per command');
  assert.equal(input.getAttribute('aria-activedescendant'), options[0]!.getAttribute('id'),
    'the active row must be named by id, not only coloured');
  assert.equal(options[0]!.getAttribute('aria-selected'), 'true');
  assert.equal(options[1]!.getAttribute('aria-selected'), 'false');

  press(input, 'ArrowDown');
  assert.equal(input.getAttribute('aria-activedescendant'), options[1]!.getAttribute('id'),
    'ArrowDown moved the highlight without moving the reference to it');

  press(input, 'ArrowUp');
  assert.equal(input.getAttribute('aria-activedescendant'), options[0]!.getAttribute('id'));

  assertPattern({
    root,
    bindingPath: BINDING,
    subjects: { default: input },
    behavioural: { 'keyboard.ArrowDown': true, 'keyboard.Escape': true, 'keyboard.Enter': true },
  });
});

test('a query matching nothing leaves no dangling active-descendant behind', () => {
  const { root, input } = render();
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set;
    setter!.call(input, 'zzzzz');
    input!.dispatchEvent(new Event('input', { bubbles: true }));
  });

  assert.equal(root.querySelectorAll<HTMLElement>('[role="option"]').length, 0, 'the fixture must actually filter to nothing');
  assert.equal(input!.hasAttribute('aria-activedescendant'), false,
    'an id pointing at a row that is not rendered is worse than no id: it reads as a name and resolves to nothing');
});

test('Escape and Enter both report through the palette own channels', () => {
  let closed = 0;
  let ran: ArenaCommand | null = null;
  const root = mount(
    <ArenaCommandPalette open commands={COMMANDS} onClose={() => { closed += 1; }} onRun={(c) => { ran = c; }} />,
  );
  const input = root.querySelector<HTMLElement>('[role="combobox"]');

  const escape = press(input!, 'Escape');
  assert.equal(escape.defaultPrevented, true, 'Escape was not claimed');
  assert.equal(closed, 1, 'Escape did not report through onClose');

  const enter = press(input!, 'Enter');
  assert.equal(enter.defaultPrevented, true, 'Enter was not claimed');
  assert.equal((ran as ArenaCommand | null)?.id, 'deploy', 'Enter did not run the active command');
  assert.equal(closed, 2, 'Enter ran the command without closing, so the palette stays over the result');
});
