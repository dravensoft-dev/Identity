import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tag } from './Tag.tsx';

test('a tone renders its dot and the tone colour; default is neutral', () => {
  const html = renderToStaticMarkup(<Tag tone="success">Shipped</Tag>);
  assert.match(html, /Shipped/);
  assert.match(html, /\bborder-success\b/);
  assert.match(html, /\btext-success\b/);
  assert.match(html, /\bbg-current\b/, 'the dot takes the tone from the text colour and draws nothing of its own');
  const neutral = renderToStaticMarkup(<Tag>Draft</Tag>);
  assert.match(neutral, /\bborder-base-300\b/);
  assert.match(neutral, /\btext-base-content\/70\b/);
});

test('removable renders a labelled dismiss button that calls onRemove', () => {
  const html = renderToStaticMarkup(<Tag removable onRemove={() => {}}>x</Tag>);
  assert.match(html, /aria-label="Remove"/);
});

test('not removable renders no dismiss button, even with onRemove passed', () => {
  const html = renderToStaticMarkup(<Tag onRemove={() => {}}>x</Tag>);
  assert.doesNotMatch(html, /aria-label="Remove"/);
});
