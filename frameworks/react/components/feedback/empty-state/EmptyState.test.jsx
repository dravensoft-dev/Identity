import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { EmptyState } from '../components/feedback/EmptyState.jsx';

test('EmptyState renders the icon as an aria-hidden <i> Arena draws, from a Phosphor class name', () => {
  const html = renderToStaticMarkup(
    <EmptyState icon="ph-duotone ph-folder-open" title="No projects yet" />
  );
  assert.match(html, /<i class="ph-duotone ph-folder-open" aria-hidden="true">/);
});

test('EmptyState with no icon renders no <i> at all', () => {
  const html = renderToStaticMarkup(<EmptyState title="No projects yet" />);
  assert.doesNotMatch(html, /<i /);
});

test('EmptyState renders the title and message text', () => {
  const html = renderToStaticMarkup(
    <EmptyState title="No projects yet" message="Create your first project to start deploying." />
  );
  assert.match(html, /No projects yet/);
  assert.match(html, /Create your first project to start deploying\./);
});

test('EmptyState throws when title is absent -- the fail-hard guard', () => {
  assert.throws(
    () => renderToStaticMarkup(<EmptyState />),
    /EmptyState: `title` is required/,
  );
});
