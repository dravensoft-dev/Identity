import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { PageHead } from './PageHead.tsx';

test('PageHead renders the title and subtitle text', () => {
  const html = renderToStaticMarkup(
    <PageHead title="Deployments" subtitle="Everything shipped in the last 30 days" />
  );
  assert.match(html, /Deployments/);
  assert.match(html, /Everything shipped in the last 30 days/);
});

test('PageHead throws when title is absent -- the fail-hard guard', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<PageHead />),
    /PageHead: `title` is required/,
  );
});

test('PageHead defaults to align="start" -- the wide layout is top-aligned', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" />);
  assert.match(html, /\barena-page-head__root--cv1\b/);
});

test('PageHead align="center" centers the actions block against the title, wide layout', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" align="center" />);
  assert.match(html, /\b(?:arena-page-head__actions|arena-page-head__root--cv2)\b/);
  assert.doesNotMatch(html, /\barena-page-head__root--cv1\b/);
});

test('PageHead no longer applies a baked bottom margin -- the parent composes spacing now', () => {
  const html = renderToStaticMarkup(<PageHead title="Deployments" />);
  assert.doesNotMatch(html, /\bmb-/);
});
