import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { PageHead } from '../components/navigation/PageHead.jsx';

test('PageHead renders the title and subtitle text', () => {
  const html = renderToStaticMarkup(
    <PageHead title="Deployments" subtitle="Everything shipped in the last 30 days" />
  );
  assert.match(html, /Deployments/);
  assert.match(html, /Everything shipped in the last 30 days/);
});

test('PageHead throws when title is absent -- the fail-hard guard', () => {
  assert.throws(
    () => renderToStaticMarkup(<PageHead />),
    /PageHead: `title` is required/,
  );
});

test('PageHead defaults to align="start" -- the wide layout is top-aligned', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" />);
  assert.match(html, /align-items:flex-start/);
});

test('PageHead align="center" centers the actions block against the title, wide layout', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" align="center" />);
  assert.match(html, /align-items:center/);
});

test('PageHead no longer applies a baked bottom margin -- the parent composes spacing now', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" />);
  assert.doesNotMatch(html, /margin-bottom/);
});
