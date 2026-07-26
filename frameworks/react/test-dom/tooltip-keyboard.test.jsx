/* Tooltip's keyboard and description path. Separate from tooltip-timer.test.jsx,
 * whose header scopes it to the single-timer rule, because these are different
 * claims about the same component and one file asserting both would say less
 * about each.
 *
 * The delays are POINTER intent. A focus must reveal IMMEDIATELY -- the token's
 * own $description says so, and routing focus through --delay-open would make a
 * control that is already hard to reach also feel broken. That is asserted here
 * without any timer at all: if focus scheduled a timeout, the bubble would not
 * exist on the line after the event.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Tooltip } from '../components/feedback/Tooltip.jsx';

afterEach(cleanup);

const one = () => (
  <Tooltip label="Rebuilds the index">
    <button type="button">Reindex</button>
  </Tooltip>
);

const trigger = (root) => root.querySelector('button');
const bubble = (root) => root.querySelector('[role="tooltip"]');
const focusIn = (root) => act(() => {
  trigger(root).dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
});
const focusOut = (root) => act(() => {
  trigger(root).dispatchEvent(new window.FocusEvent('focusout', { bubbles: true }));
});
const press = (root, key) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { trigger(root).dispatchEvent(ev); });
  return ev;
};

test('focus reveals the tooltip immediately, with no delay to wait out', () => {
  const root = mount(one());
  assert.equal(bubble(root), null);
  focusIn(root);
  assert.notEqual(bubble(root), null, 'focus did not reveal the tooltip, or routed it through --delay-open');
});

test('blur withdraws it immediately too -- a blur is a decision, not a pointer leaving a hit box', () => {
  const root = mount(one());
  focusIn(root);
  focusOut(root);
  assert.equal(bubble(root), null);
});

test('while shown, the trigger describes itself with the bubble', () => {
  const root = mount(one());
  focusIn(root);
  const id = bubble(root).getAttribute('id');
  assert.ok(id, 'the bubble has no id for the trigger to reference');
  assert.equal(trigger(root).getAttribute('aria-describedby'), id);
});

test('while hidden, the trigger references nothing -- a dangling IDREF is worse than none', () => {
  const root = mount(one());
  assert.equal(trigger(root).getAttribute('aria-describedby'), null);
});

test('Escape dismisses it', () => {
  const root = mount(one());
  focusIn(root);
  press(root, 'Escape');
  assert.equal(bubble(root), null);
});

test('a key Tooltip does not handle is left alone', () => {
  const root = mount(one());
  focusIn(root);
  const ev = press(root, 'a');
  assert.equal(ev.defaultPrevented, false);
  assert.notEqual(bubble(root), null);
});

test('the tooltip itself never takes the tab sequence', () => {
  const root = mount(one());
  focusIn(root);
  assert.equal(bubble(root).hasAttribute('tabindex'), false);
});

test('the binding is honest: every `tooltip` requirement, in both directions', () => {
  const root = mount(one());
  focusIn(root);
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'feedback', 'Tooltip.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tooltip"]'),
      /* roles.describedby is a claim about the TRIGGER, not the bubble. */
      'roles.describedby': root.querySelector('button'),
    },
    behavioural: {
      'keyboard.Escape': true,
      'focus.never': true,
    },
  });
});
