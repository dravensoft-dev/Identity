import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { BulkActionBar } from '../components/navigation/BulkActionBar.jsx';

test('an action renders its icon as a Phosphor class and its label as text', () => {
  const html = renderToStaticMarkup(
    <BulkActionBar count={3} actions={[{ id: 'archive', label: 'Archive', icon: 'ph-bold ph-archive' }]} />,
  );
  assert.ok(html.includes('class="ph-bold ph-archive"'), 'the icon is drawn from the class name');
  assert.ok(html.includes('Archive'), 'the label is rendered');
  /* The count sits inside its own <b>, so "3 items selected" is never one
   * contiguous run of text in the markup -- assert on the two pieces either
   * side of that tag instead of a substring that can never match. */
  assert.match(html, /<b[^>]*>3<\/b> items selected/, 'the count and default noun are rendered');
});

test('a count of zero renders nothing', () => {
  assert.equal(renderToStaticMarkup(<BulkActionBar count={0} actions={[]} />), '');
});

test('an absent required member throws rather than rendering', () => {
  assert.throws(() => renderToStaticMarkup(<BulkActionBar actions={[]} />), /`count` is required/);
});

test('a consumer style prop is dropped, not spread onto the root', () => {
  const html = renderToStaticMarkup(
    <BulkActionBar count={1} actions={[]} style={{ color: 'rgb(255, 0, 0)' }} />,
  );
  assert.ok(!html.includes('rgb(255, 0, 0)'), 'a consumer style never reaches the root (R4)');
});
