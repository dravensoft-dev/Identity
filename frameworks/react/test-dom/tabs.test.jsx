/* The DOM half of Tabs' proof. Everything here needs a real event to have
 * happened and a real attribute or a real focus to have moved as a result.
 *
 * What this suite may and may not claim, because happy-dom bounds it:
 *   - a dispatched `click` runs React's handler, and our own `.focus()` moves
 *     document.activeElement: PROVABLE, and the arrow-key tests rest on both.
 *   - `document.activeElement` after a Tab keypress: NEVER asserted. happy-dom has
 *     no sequential focus navigation, so such a test passes identically against a
 *     correct implementation and none. The roving tab stop is asserted as
 *     `tabindex` instead -- structure, not sequence -- and the panel being
 *     reachable by Tab is checked by a person against Tabs.prompt.md's checklist.
 *   - a keydown of Enter or Space on a native <button> does NOT synthesise a click
 *     here. No test below depends on one; a tab is activated by click and by arrow.
 */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from './harness.jsx';
import { assertPattern, REACT_COMPONENTS } from './assert-pattern.jsx';
import { Tabs } from '../components/navigation/Tabs.jsx';
import { Tab } from '../components/navigation/Tab.jsx';

afterEach(cleanup);

const three = (props = {}) => (
  <Tabs defaultValue="ov" onChange={props.onChange}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
    <Tab value="ac" label="Activity"><p>activity body</p></Tab>
  </Tabs>
);

const tabsOf = (root) => [...root.querySelectorAll('[role="tab"]')];
const panelOf = (root) => root.querySelector('[role="tabpanel"]');
const arrow = (root, key) => act(() => {
  root.querySelector('[role="tablist"]')
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
});

test('clicking a tab selects it: aria-selected, the tab stop and the panel all move together', () => {
  const root = mount(three());
  const [ov, dp] = tabsOf(root);
  assert.equal(ov.getAttribute('aria-selected'), 'true');
  assert.equal(dp.getAttribute('aria-selected'), 'false');

  act(() => { dp.click(); });

  const [ov2, dp2] = tabsOf(root);
  assert.equal(dp2.getAttribute('aria-selected'), 'true');
  assert.equal(ov2.getAttribute('aria-selected'), 'false');
  assert.equal(dp2.getAttribute('tabindex'), '0');
  assert.equal(ov2.getAttribute('tabindex'), '-1');
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('change reported exactly one value per selection', () => {
  const seen = [];
  const root = mount(three({ onChange: (v) => seen.push(v) }));
  act(() => { tabsOf(root)[1].click(); });
  act(() => { tabsOf(root)[2].click(); });
  assert.deepEqual(seen, ['dp', 'ac']);
});

/* focus.roving, the half a DOM can hold: ONE tab stop, and it moves. The other
   half -- that Tab from the strip leaves it -- is the browser's, not ours. */
test('exactly one tab is in the tab sequence, before and after a move', () => {
  const root = mount(three());
  const stops = () => tabsOf(root).filter((t) => t.getAttribute('tabindex') === '0');
  assert.equal(stops().length, 1);
  arrow(root, 'ArrowRight');
  assert.equal(stops().length, 1, 'a second tab stop appeared inside the tablist');
  assert.equal(stops()[0].textContent, 'Deployments');
});

test('ArrowRight moves selection and focus to the next tab', () => {
  const root = mount(three());
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[1].getAttribute('aria-selected'), 'true');
  /* Our own .focus() call, which happy-dom honours -- not a claim about Tab. */
  assert.equal(document.activeElement, tabsOf(root)[1]);
  assert.match(panelOf(root).textContent, /deployments body/);
});

test('ArrowLeft moves the other way, and both directions wrap', () => {
  const root = mount(three());
  arrow(root, 'ArrowLeft');
  assert.equal(tabsOf(root)[2].getAttribute('aria-selected'), 'true', 'ArrowLeft did not wrap to the last tab');
  arrow(root, 'ArrowRight');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true', 'ArrowRight did not wrap to the first tab');
});

test('a key the pattern does not claim is left alone', () => {
  const root = mount(three());
  const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  act(() => { root.querySelector('[role="tablist"]').dispatchEvent(ev); });
  assert.equal(ev.defaultPrevented, false, 'Tabs cancelled a key it does not handle');
  assert.equal(tabsOf(root)[0].getAttribute('aria-selected'), 'true');
});

test('the selected tab and its panel reference each other in the real DOM', () => {
  const root = mount(three());
  const selected = tabsOf(root).find((t) => t.getAttribute('aria-selected') === 'true');
  const panel = panelOf(root);
  assert.equal(selected.getAttribute('aria-controls'), panel.getAttribute('id'));
  assert.equal(panel.getAttribute('aria-labelledby'), selected.getAttribute('id'));
  /* And the ids are selectable, which is why the colons useId() returns are stripped. */
  assert.equal(root.querySelector(`#${panel.getAttribute('id')}`), panel);
});

test('the binding is honest: every `tabs` requirement, in both directions', () => {
  const root = mount(three());
  assertPattern({
    root,
    bindingPath: join(REACT_COMPONENTS, 'navigation', 'Tabs.behaviour.json'),
    subjects: {
      default: root.querySelector('[role="tablist"]'),
      'roles.tab': root.querySelector('[role="tab"]'),
      'roles.controls': root.querySelector('[role="tab"]'),
      'states.selected': root.querySelector('[role="tab"]'),
      'roles.tabpanel': root.querySelector('[role="tabpanel"]'),
    },
    /* focus.* and keyboard.* return null from the shared evaluator -- no single
       element can decide them -- so each must be named here and each is proved by
       one of the tests above, which act on the tree rather than reading it. */
    behavioural: {
      'focus.roving': true,
      'keyboard.ArrowLeft': true,
      'keyboard.ArrowRight': true,
    },
  });
});
