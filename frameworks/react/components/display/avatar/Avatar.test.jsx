import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Avatar } from '../components/display/Avatar.jsx';

test('renders initials from name when there is no src', () => {
  const html = renderToStaticMarkup(<Avatar name="Ada Lovelace" />);
  assert.match(html, />AL</);
});

test('a status renders a labelled presence dot', () => {
  const html = renderToStaticMarkup(<Avatar name="Ada" status="online" />);
  assert.match(html, /aria-label="online"/);
});
