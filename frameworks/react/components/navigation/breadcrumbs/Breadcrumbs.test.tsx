import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Breadcrumbs } from './Breadcrumbs.tsx';

const LABEL = 'Project navigation';

const ITEMS = [
  { label: 'Clients', href: '/clients' },
  { label: 'Acme Corp', href: '/clients/acme' },
  { label: 'Overview' },
];

test('the trail renders every crumb, in order', () => {
  const html = renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} items={ITEMS} />);
  assert.match(html, /Clients/);
  assert.match(html, /Acme Corp/);
  assert.match(html, /Overview/);
  assert.ok(html.indexOf('Clients') < html.indexOf('Acme Corp'), 'root must render before its child');
  assert.ok(html.indexOf('Acme Corp') < html.indexOf('Overview'), 'the trail must render root-first');
});

test('the last crumb is not a link, and carries aria-current="page"', () => {
  const html = renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} items={ITEMS} />);
  const lastCrumb = /<span aria-current="page"[^>]*>Overview<\/span>/.exec(html);
  assert.ok(lastCrumb, `expected the current crumb as a non-link <span aria-current="page">, got: ${html}`);
});

test('a non-current crumb renders as a real anchor carrying onNavigate\'s own call site', () => {
  const html = renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} items={ITEMS} onNavigate={() => {}} />);
  assert.match(html, /<a href="\/clients"[^>]*>Clients<\/a>/);
  assert.match(html, /<a href="\/clients\/acme"[^>]*>Acme Corp<\/a>/);
});

test('with no onNavigate at all, a non-current crumb still renders as an anchor -- the callback is optional, the link is not', () => {
  const html = renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} items={ITEMS} />);
  assert.match(html, /<a href="\/clients"[^>]*>Clients<\/a>/);
});

test('throws when items is absent', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} />), /items.*required/);
});

test('throws when ariaLabel is absent -- nothing can derive the name of a trail', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<Breadcrumbs items={ITEMS} />),
    /Breadcrumbs: `ariaLabel` is required/,
  );
});

test('an empty items array is supplied-but-empty and stays legal', () => {
  const html = renderToStaticMarkup(<Breadcrumbs ariaLabel={LABEL} items={[]} />);
  assert.match(html, new RegExp(`<nav aria-label="${LABEL}"`));
  assert.doesNotMatch(html, /<a /);
});

test('the last crumb and the ones before it are two slots of one recipe', () => {
  const html = renderToStaticMarkup(
    <Breadcrumbs ariaLabel="Where" items={[{ label: 'Root', href: '/a' }, { label: 'Here' }]} />,
  );
  assert.match(html, /class="[^"]*\btext-base-content\/62\b[^"]*"[^>]*>Root/, 'a link crumb is dimmed');
  assert.match(html, /hover:text-base-content\/82/, 'and lifts on hover through a modifier, not a handler');
  assert.match(html, /class="[^"]*\bfont-bold\b[^"]*"[^>]*>Here/, 'the current crumb is the emphatic one');
});
