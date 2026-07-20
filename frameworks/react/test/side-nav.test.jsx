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

test('the item text re-densifies with the control scale', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} />);
  assert.match(html, /var\(--dz-text\)/);
});
