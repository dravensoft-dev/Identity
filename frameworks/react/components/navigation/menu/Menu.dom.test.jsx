/* `DropsProps` below is the load-bearing fixture: Arena's own components forward
 * the props they DECLARE and drop the rest, since the API contract flattened
 * their {...rest} spreads, so `onClick` arrives and aria-haspopup does not.
 * That is the DEFAULT usage on the demo page, where the trigger is <Button>,
 * and every other assertion here uses a raw <button> -- the one shape a
 * cloneElement injection reaches. It fails without the DOM guarantee. */
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { join } from 'node:path';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
import { assertPattern, REACT_COMPONENTS } from '../../../test/AssertPattern.jsx';
import { isFocusable } from '../../../../../scripts/lib/behaviour-compliance.mjs';
import { Menu } from './Menu.jsx';

afterEach(cleanup);

function open(root) {
  act(() => { root.querySelector('button').click(); });
  return root.querySelector('[role="menu"]');
}

test('activating an entry reports the whole item, not a key and not a DOM event', () => {
  const items = [{ label: 'Rename' }, { label: 'Archive' }];
  const seen = [];
  const root = mount(<Menu trigger={<button type="button">Open</button>} items={items} onSelect={(i) => seen.push(i)} />);
  const panel = open(root);
  const rows = panel.querySelectorAll('[role="menuitem"]');
  assert.equal(rows.length, 2);
  act(() => { rows[1].click(); });
  assert.equal(seen.length, 1, 'select did not fire');
  assert.equal(seen[0], items[1], 'select did not carry the item the caller passed in');
  assert.equal(seen[0].preventDefault, undefined, 'a DOM event is travelling in the payload');
});

test('activating an entry closes the menu', () => {
  const root = mount(<Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />);
  const panel = open(root);
  act(() => { panel.querySelector('[role="menuitem"]').click(); });
  assert.equal(root.querySelector('[role="menu"]'), null, 'the menu stayed open after an entry was activated');
});

test('a disabled entry reports nothing', () => {
  const seen = [];
  const root = mount(
    <Menu trigger={<button type="button">Open</button>}
      items={[{ label: 'Delete', disabled: true }]} onSelect={(i) => seen.push(i)} />,
  );
  const row = open(root).querySelector('[role="menuitem"]');
  act(() => { row.click(); });
  assert.equal(seen.length, 0, 'a disabled entry reported select');
});

test('icon is a class name Arena draws, and never reaches the page as text', () => {
  const root = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'View logs', icon: 'ph-bold ph-scroll' }]} />,
  );
  const panel = open(root);
  const glyph = panel.querySelector('i');
  assert.notEqual(glyph, null, 'no <i> was drawn for the entry icon');
  assert.equal(glyph.getAttribute('class'), 'ph-bold ph-scroll');
  assert.equal(glyph.getAttribute('aria-hidden'), 'true');
  assert.equal(panel.textContent, 'View logs', 'the icon class name was drawn as text');
});

test('a consumer style object reaches no part of the opened panel', () => {
  const root = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(open(root).outerHTML, /#ff00ff/,
    'a consumer style reached the panel -- the R4 escape is back');
});

test('a consumer attribute reaches no part of the opened panel', () => {
  const root = mount(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} data-stray="x" />,
  );
  assert.doesNotMatch(open(root).outerHTML, /data-stray/,
    'a consumer attribute reached the panel -- a {...rest} escape is back');
});

test('a divider and a header draw no activatable row', () => {
  const root = mount(
    <Menu trigger={<button type="button">Open</button>}
      items={[{ header: 'Deployment' }, { label: 'View logs' }, { divider: true }]} />,
  );
  const panel = open(root);
  assert.equal(panel.querySelectorAll('[role="menuitem"]').length, 1,
    'a divider or a header rendered as an activatable entry');
  assert.match(panel.textContent, /Deployment/, 'the header did not render');
});

const BINDING = join(REACT_COMPONENTS, 'navigation/menu/Menu.behaviour.json');

function press(el, key) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  act(() => { el.dispatchEvent(event); });
  return event;
}

test('the popup state sits on the focusable trigger, not on a wrapper around it', () => {
  const root = mount(<Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />);
  const trigger = root.querySelector('button');

  assert.equal(trigger.getAttribute('aria-haspopup'), 'menu',
    'ARIA is not inherited from an ancestor, so a wrapper carrying this names nothing');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(isFocusable(trigger), true, 'the carrier must be the element that takes focus');
  assert.equal(root.querySelectorAll('[aria-haspopup]').length, 1,
    'exactly one element may claim the popup');
});

test('Menu meets the menu-button pattern it binds', () => {
  const root = mount(<Menu trigger={<button type="button">Open</button>}
    items={[{ label: 'Rename' }, { label: 'Delete', destructive: true }]} />);
  const trigger = root.querySelector('button');

  for (const key of ['Enter', ' ']) {
    const event = press(trigger, key);
    assert.equal(event.defaultPrevented, false,
      `a handler of ours cancelled ${key === ' ' ? 'Space' : key}, suppressing the button's own activation`);
  }
  assert.equal(trigger.tagName, 'BUTTON',
    'Enter and Space reach onClick through the platform, which needs a real button to do it');

  act(() => { trigger.click(); });
  const panel = root.querySelector('[role="menu"]');
  assert.ok(panel, 'activating the trigger did not open the menu');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'the open state did not reach the trigger');
  const first = panel.querySelector('[role="menuitem"]');
  assert.equal(document.activeElement, first,
    'opening left focus on the trigger, so a keyboard user reaches the panel only by Tab');

  press(first, 'Escape');
  assert.equal(root.querySelector('[role="menu"]'), null, 'Escape did not close the menu');
  assert.equal(document.activeElement, trigger,
    'Escape closed the menu and dropped focus, which strands a keyboard user at the top of the page');

  assertPattern({
    root,
    bindingPath: BINDING,
    subjects: { default: trigger },
    behavioural: {
      'focus.onOpen': true, 'keyboard.Enter': true, 'keyboard.Space': true, 'keyboard.Escape': true,
    },
  });
});

function DropsProps({ children, onClick }) {
  return <button type="button" onClick={onClick}>{children}</button>;
}

test('the popup state reaches a trigger that drops every prop it is handed', () => {
  const root = mount(<Menu trigger={<DropsProps>Open</DropsProps>} items={[{ label: 'Rename' }]} />);
  const trigger = root.querySelector('button');

  assert.equal(trigger.getAttribute('aria-haspopup'), 'menu',
    'a prop-dropping trigger left the popup state nowhere, which is what the demo page does');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');

  act(() => { trigger.click(); });
  assert.equal(trigger.getAttribute('aria-expanded'), 'true', 'the open state did not follow');
  press(root.querySelector('[role="menuitem"]'), 'Escape');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false', 'the closed state did not follow');
});
