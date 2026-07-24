import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tag } from '../components/display/Tag.jsx';

test('a tone renders its dot and the tone colour; default is neutral', () => {
  const html = renderToStaticMarkup(<Tag tone="success">Shipped</Tag>);
  assert.match(html, /Shipped/);
  assert.match(html, /var\(--color-success\)/);
  const neutral = renderToStaticMarkup(<Tag>Draft</Tag>);
  assert.match(neutral, /var\(--bone-dim\)/);
});

test('removable renders a labelled dismiss button that calls onRemove', () => {
  const html = renderToStaticMarkup(<Tag removable onRemove={() => {}}>x</Tag>);
  assert.match(html, /aria-label="Remove"/);
});

test('not removable renders no dismiss button, even with onRemove passed', () => {
  const html = renderToStaticMarkup(<Tag onRemove={() => {}}>x</Tag>);
  assert.doesNotMatch(html, /aria-label="Remove"/);
});
