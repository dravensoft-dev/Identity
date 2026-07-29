import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { mount, cleanup, act } from '../../../test/Harness.jsx';
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
