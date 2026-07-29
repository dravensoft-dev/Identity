import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { Tooltip } from './Tooltip.jsx';
import { delayOpen } from '../../../Tokens.generated.js';

afterEach(cleanup);

const MARGIN = 120;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wait = (ms) => act(async () => { await sleep(ms); });

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

const pressElsewhere = (key) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { document.body.dispatchEvent(ev); });
  return ev;
};

const hover = (root) => act(() => {
  root.firstElementChild.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));
});

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

test('Escape dismisses a hover-revealed tooltip when the keydown lands outside the wrapper', async () => {
  const root = mount(one());
  hover(root);
  await wait(delayOpen + MARGIN);
  assert.notEqual(bubble(root), null, 'the hover never revealed it -- the test proves nothing');
  pressElsewhere('Escape');
  assert.equal(bubble(root), null,
    'a hover-revealed tooltip could not be dismissed from outside its wrapper');
});

test('the document listener is gone once the tooltip is hidden', () => {
  const root = mount(one());
  focusIn(root);
  press(root, 'Escape');
  assert.equal(bubble(root), null);

  pressElsewhere('Escape');
  assert.equal(bubble(root), null);
});

test('a consumer\'s own aria-describedby survives while the tooltip is hidden', () => {
  const root = mount(
    <Tooltip label="Rebuilds the index">
      <button type="button" aria-describedby="password-rules">Reindex</button>
    </Tooltip>,
  );
  assert.equal(trigger(root).getAttribute('aria-describedby'), 'password-rules',
    'the consumer\'s own description was destroyed by a tooltip that is not even showing');
});

test('a consumer\'s own aria-describedby survives while the tooltip is shown, beside the bubble', () => {
  const root = mount(
    <Tooltip label="Rebuilds the index">
      <button type="button" aria-describedby="password-rules">Reindex</button>
    </Tooltip>,
  );
  focusIn(root);
  const ids = (trigger(root).getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  assert.ok(ids.includes('password-rules'), 'the consumer\'s own description was overwritten by the bubble');
  assert.ok(ids.includes(bubble(root).getAttribute('id')), 'the bubble does not describe the trigger');
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
    bindingPath: join(REACT_COMPONENTS, 'feedback', 'tooltip', 'Tooltip.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tooltip"]'),

      'roles.describedby': root.querySelector('button'),
    },
    behavioural: {
      'keyboard.Escape': true,
      'focus.never': true,
    },
  });
});
