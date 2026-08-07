import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaErrorState } from './ArenaErrorState.tsx';

test('title defaults to "Something went wrong" when omitted', () => {
  const html = renderToStaticMarkup(<ArenaErrorState />);
  assert.match(html, /Something went wrong/);
});

test('retryLabel renders a retry button with that label; absent renders no retry button', () => {
  const withRetry = renderToStaticMarkup(
    <ArenaErrorState retryLabel="Try again" onRetry={() => {}} />
  );
  assert.match(withRetry, /<button/);
  assert.match(withRetry, /Try again/);

  const withoutRetry = renderToStaticMarkup(<ArenaErrorState onRetry={() => {}} />);
  assert.doesNotMatch(withoutRetry, /<button/);
});

test('icon renders as an aria-hidden <i className>', () => {
  const html = renderToStaticMarkup(<ArenaErrorState icon="ph-fill ph-warning-octagon" />);
  assert.match(html, /<i class="ph-fill ph-warning-octagon" aria-hidden="true">/);
});

test('secondaryAction renders the projected node', () => {
  const html = renderToStaticMarkup(<ArenaErrorState secondaryAction={<button>View logs</button>} />);
  assert.match(html, /View logs/);
});

test('the root announces itself -- the failure is heard, not only read', () => {
  const html = renderToStaticMarkup(<ArenaErrorState title="Failed" />);
  assert.match(html, /^<div role="alert"/);
});
