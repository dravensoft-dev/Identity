import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ErrorState } from '../components/feedback/ErrorState.jsx';

test('title defaults to "Something went wrong" when omitted', () => {
  const html = renderToStaticMarkup(<ErrorState />);
  assert.match(html, /Something went wrong/);
});

test('retryLabel renders a retry button with that label; absent renders no retry button', () => {
  const withRetry = renderToStaticMarkup(
    <ErrorState retryLabel="Try again" onRetry={() => {}} />
  );
  assert.match(withRetry, /<button/);
  assert.match(withRetry, /Try again/);

  const withoutRetry = renderToStaticMarkup(<ErrorState onRetry={() => {}} />);
  assert.doesNotMatch(withoutRetry, /<button/);
});

test('icon renders as an aria-hidden <i className>', () => {
  const html = renderToStaticMarkup(<ErrorState icon="ph-fill ph-warning-octagon" />);
  assert.match(html, /<i class="ph-fill ph-warning-octagon" aria-hidden="true">/);
});

test('secondaryAction renders the projected node', () => {
  const html = renderToStaticMarkup(<ErrorState secondaryAction={<button>View logs</button>} />);
  assert.match(html, /View logs/);
});

test('the root renders a plain div with no role attribute -- pins the roles.element exception', () => {
  const html = renderToStaticMarkup(<ErrorState title="Failed" />);
  assert.match(html, /^<div /);
  assert.doesNotMatch(html, /role="/);
});
