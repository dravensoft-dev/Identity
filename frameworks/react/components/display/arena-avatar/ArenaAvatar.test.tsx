import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaAvatar } from './ArenaAvatar.tsx';

test('renders initials from name when there is no src', () => {
  const html = renderToStaticMarkup(<ArenaAvatar name="Ada Lovelace" />);
  assert.match(html, />AL</);
});

test('a status renders a labelled presence dot', () => {
  const html = renderToStaticMarkup(<ArenaAvatar name="Ada" status="online" />);
  assert.match(html, /aria-label="online"/);
});
