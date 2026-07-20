import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';

const ITEMS = [
  { id: 'dashboard', label: 'Projects', href: '/projects' },
  { id: 'settings', label: 'Settings' },
];

test('an item with href is an anchor, one without is a button', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} active="dashboard" />);
  assert.match(html, /<a [^>]*href="\/projects"/);
  assert.match(html, /<button /);
});

test('the active item carries aria-current="page" and nothing else does', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} active="dashboard" />);
  assert.equal(html.match(/aria-current="page"/g).length, 1);
});

test('the nav is labelled', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" />);
  assert.match(html, /<nav [^>]*aria-label="Primary"/);
});

test('active and inactive items differ in weight and colour', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} active="dashboard" />);
  assert.match(html, /var\(--crimson-soft\)/);
  assert.match(html, /var\(--fw-semibold\)/);
  assert.match(html, /var\(--fw-medium\)/);
});

/* renderToStaticMarkup cannot dispatch a click, so the handler is reached the one
 * other way a function component allows: call the component and read the onClick
 * off the element it returned. That is the contract itself — the second argument. */
test('onNav receives the click event, so a single-page app can preventDefault', () => {
  const seen = [];
  const tree = SideNav({ items: ITEMS, onNav: (id, event) => seen.push([id, event]) });
  const [anchor, button] = tree.props.children;
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };

  anchor.props.onClick(event);
  assert.deepEqual(seen[0][0], 'dashboard');
  assert.equal(seen[0][1], event);

  button.props.onClick(event);
  assert.equal(seen[1][0], 'settings');
  assert.equal(seen[1][1], event);
});

test('an onNav that ignores the event still works, and clicking without one does not throw', () => {
  const seen = [];
  const tree = SideNav({ items: ITEMS, onNav: (id) => seen.push(id) });
  tree.props.children[0].props.onClick({});
  assert.deepEqual(seen, ['dashboard']);

  const bare = SideNav({ items: ITEMS });
  assert.doesNotThrow(() => bare.props.children[0].props.onClick({}));
});

test('the item text re-densifies with the control scale', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} />);
  assert.match(html, /var\(--dz-text\)/);
});
