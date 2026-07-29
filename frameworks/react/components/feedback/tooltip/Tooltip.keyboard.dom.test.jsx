/* Tooltip's keyboard and description path. Separate from Tooltip.timer.dom.test.jsx,
 * whose header scopes it to the single-timer rule, because these are different
 * claims about the same component and one file asserting both would say less
 * about each.
 *
 * The delays are POINTER intent. A focus must reveal IMMEDIATELY -- the token's
 * own $description says so, and routing focus through --delay-open would make a
 * control that is already hard to reach also feel broken. That is asserted here
 * without any timer at all: if focus scheduled a timeout, the bubble would not
 * exist on the line after the event.
 *
 * ONE test below does wait out a real --delay-open, because Escape's whole point
 * is the POINTER-revealed bubble and a pointer cannot reveal one any faster. That
 * makes this file a second contributor to the known, pre-existing "update to
 * Tooltip was not wrapped in act(...)" warning Tooltip.timer.dom.test.jsx's header
 * documents at length: it is a warning, the run stays green, and the instruction
 * there stands -- do not chase it by widening MARGIN, and do not add a fake-timer
 * dependency to this repository to make it go away.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { Tooltip } from './Tooltip.jsx';
import { delayOpen } from '../../../Tokens.generated.js';

afterEach(cleanup);

/** Margin either side of a delay boundary, the same figure and the same reason
 *  Tooltip.timer.dom.test.jsx gives: large enough that ordinary timer jitter cannot
 *  cross it, small enough that the one test needing it stays cheap. */
const MARGIN = 120;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Wait real wall-clock time inside act(), so the timer's state update is
 *  flushed before the assertion reads the DOM. */
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
/** A keydown whose target is OUTSIDE the Tooltip's wrapper entirely. `document.body`
 *  is not a descendant of the wrapper, so no handler the wrapper carries can see
 *  this event -- only a document-level listener can. */
const pressElsewhere = (key) => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { document.body.dispatchEvent(ev); });
  return ev;
};
/** React 18 synthesises onMouseEnter from a delegated `mouseover`; a literal
 *  `mouseenter` is a silent no-op. Tooltip.timer.dom.test.jsx's header has the whole
 *  measurement. The handlers sit on the wrapper span, not on the child. */
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

/* THE POINTER-REVEALED TOOLTIP, and it is a WCAG 1.4.13 requirement rather than
 * only a pattern one: content shown on hover must be dismissible without moving
 * the pointer. A hover leaves focus wherever it already was -- anywhere on the
 * page -- so a keydown handler on the wrapper never sees the Escape, and the
 * listener has to be on the document for the whole time the bubble is up. */
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
  /* Nothing to assert on but the absence of a throw and of a re-render: a
     listener left behind would call setShow on every keystroke in the app. */
  pressElsewhere('Escape');
  assert.equal(bubble(root), null);
});

/* aria-describedby is a SPACE-SEPARATED ID LIST, which is the whole point of the
 * attribute. Overwriting it takes the consumer's own description away silently
 * and permanently -- an input loses its password rules for a screen-reader user
 * and nothing anywhere says so. */
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
      /* roles.describedby is a claim about the TRIGGER, not the bubble. */
      'roles.describedby': root.querySelector('button'),
    },
    behavioural: {
      'keyboard.Escape': true,
      'focus.never': true,
    },
  });
});
