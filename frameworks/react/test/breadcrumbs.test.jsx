/* `onNavigate` (`api/components/Breadcrumbs.json`) is new wiring this branch
 * added and left untested. `renderToStaticMarkup` is DOM-free by this
 * directory's own convention, so it cannot dispatch a synthetic click and
 * observe `onNavigate` fire -- that would need a real DOM, which belongs in
 * frameworks/react/test-dom/, not here, and no suite anywhere in this repo
 * currently renders Breadcrumbs with a DOM. What IS provable without one:
 * the trail renders in order, the last crumb is not a link and carries
 * `aria-current="page"`, and every non-current crumb is a real anchor
 * (`onNavigate`'s own call site). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Breadcrumbs } from '../components/navigation/Breadcrumbs.jsx';

const ITEMS = [
  { label: 'Clients', href: '/clients' },
  { label: 'Acme Corp', href: '/clients/acme' },
  { label: 'Overview' },
];

test('the trail renders every crumb, in order', () => {
  const html = renderToStaticMarkup(<Breadcrumbs items={ITEMS} />);
  assert.match(html, /Clients/);
  assert.match(html, /Acme Corp/);
  assert.match(html, /Overview/);
  assert.ok(html.indexOf('Clients') < html.indexOf('Acme Corp'), 'root must render before its child');
  assert.ok(html.indexOf('Acme Corp') < html.indexOf('Overview'), 'the trail must render root-first');
});

test('the last crumb is not a link, and carries aria-current="page"', () => {
  const html = renderToStaticMarkup(<Breadcrumbs items={ITEMS} />);
  const lastCrumb = /<span aria-current="page"[^>]*>Overview<\/span>/.exec(html);
  assert.ok(lastCrumb, `expected the current crumb as a non-link <span aria-current="page">, got: ${html}`);
});

test('a non-current crumb renders as a real anchor carrying onNavigate\'s own call site', () => {
  const html = renderToStaticMarkup(<Breadcrumbs items={ITEMS} onNavigate={() => {}} />);
  assert.match(html, /<a href="\/clients"[^>]*>Clients<\/a>/);
  assert.match(html, /<a href="\/clients\/acme"[^>]*>Acme Corp<\/a>/);
});

test('with no onNavigate at all, a non-current crumb still renders as an anchor -- the callback is optional, the link is not', () => {
  const html = renderToStaticMarkup(<Breadcrumbs items={ITEMS} />);
  assert.match(html, /<a href="\/clients"[^>]*>Clients<\/a>/);
});
