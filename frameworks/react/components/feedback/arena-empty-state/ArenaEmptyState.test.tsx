import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaEmptyState } from './ArenaEmptyState.tsx';

test('ArenaEmptyState renders the icon as an aria-hidden <i> Arena draws, from a Phosphor class name', () => {
  const html = renderToStaticMarkup(
    <ArenaEmptyState icon="ph-duotone ph-folder-open" title="No projects yet" />
  );
  assert.match(html, /<i class="ph-duotone ph-folder-open" aria-hidden="true">/);
});

test('ArenaEmptyState with no icon renders no <i> at all', () => {
  const html = renderToStaticMarkup(<ArenaEmptyState title="No projects yet" />);
  assert.doesNotMatch(html, /<i /);
});

test('ArenaEmptyState renders the title and message text', () => {
  const html = renderToStaticMarkup(
    <ArenaEmptyState title="No projects yet" message="Create your first project to start deploying." />
  );
  assert.match(html, /No projects yet/);
  assert.match(html, /Create your first project to start deploying\./);
});

test('ArenaEmptyState throws when title is absent -- the fail-hard guard', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<ArenaEmptyState />),
    /ArenaEmptyState: `title` is required/,
  );
});
