import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Skeleton } from './Skeleton.jsx';

test('a text skeleton renders `lines` rows, the last one short', () => {
  const html = renderToStaticMarkup(<Skeleton variant="text" lines={3} />);
  assert.equal((html.match(/arena-skeleton/g) || []).length, 3);
  assert.match(html, /62%/);
});

test('width/height/radius are plain CSS strings the render passes through', () => {

  const html = renderToStaticMarkup(<Skeleton variant="block" width="var(--sp-1)" height="var(--sp-3)" radius="var(--r-lg)" />);
  assert.ok(html.includes('var(--sp-1)'), 'the width string must reach the rendered style');
  assert.ok(html.includes('var(--sp-3)'), 'the height string must reach the rendered style');
  assert.ok(html.includes('var(--r-lg)'), 'the radius string must reach the rendered style as border-radius');
});
