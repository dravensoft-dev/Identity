import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Switch } from './Switch.tsx';

test('on renders iconOn and aria-checked="true"', () => {
  const html = renderToStaticMarkup(<Switch state iconOn="ph-bold ph-sun" iconOff="ph-bold ph-moon" label="Dark theme" />);
  assert.match(html, /aria-checked="true"/);
  assert.match(html, /ph-bold ph-sun/);
  assert.doesNotMatch(html, /ph-bold ph-moon/);
});

test('off renders iconOff and aria-checked="false"', () => {
  const html = renderToStaticMarkup(<Switch state={false} iconOn="ph-bold ph-sun" iconOff="ph-bold ph-moon" label="Dark theme" />);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /ph-bold ph-moon/);
  assert.doesNotMatch(html, /ph-bold ph-sun/);
});
