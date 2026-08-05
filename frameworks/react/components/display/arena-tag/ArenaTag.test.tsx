import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaTag } from './ArenaTag.tsx';

test('a tone renders its dot and the tone colour; default is neutral', () => {
  const html = renderToStaticMarkup(<ArenaTag tone="success">Shipped</ArenaTag>);
  assert.match(html, /Shipped/);
  assert.match(html, /\barena-tag__root--tone-success\b/);
  assert.match(html, /\barena-tag__root--tone-success\b/);
  assert.match(html, /\barena-tag__dot\b/, 'the dot takes the tone from the text colour and draws nothing of its own');
  const neutral = renderToStaticMarkup(<ArenaTag>Draft</ArenaTag>);
  assert.match(neutral, /\barena-tag__root--tone-neutral\b/);
  assert.match(neutral, /\barena-tag__root--tone-neutral\b/);
});

test('removable renders a labelled dismiss button that calls onRemove', () => {
  const html = renderToStaticMarkup(<ArenaTag removable onRemove={() => {}}>x</ArenaTag>);
  assert.match(html, /aria-label="Remove"/);
});

test('not removable renders no dismiss button, even with onRemove passed', () => {
  const html = renderToStaticMarkup(<ArenaTag onRemove={() => {}}>x</ArenaTag>);
  assert.doesNotMatch(html, /aria-label="Remove"/);
});
