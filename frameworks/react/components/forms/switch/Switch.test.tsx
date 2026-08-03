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

test('the track footprint and the knob travel are two composite variants, not a size table', () => {
  const off = renderToStaticMarkup(<Switch label="Dark theme" />);
  assert.match(off, /\bw-10\b/);
  assert.match(off, /\bh-5\.5\b/);
  assert.match(off, /\btranslate-x-0\b/);
  assert.match(off, /\bbg-neutral\b/);

  const on = renderToStaticMarkup(<Switch state label="Dark theme" />);
  assert.match(on, /\btranslate-x-full\b/);
  assert.match(on, /\bbg-primary\b/);

  const tall = renderToStaticMarkup(<Switch label="Dark theme" orientation="vertical" size="lg" />);
  assert.match(tall, /\bw-6\.5\b/);
  assert.match(tall, /\bh-12\b/);
  assert.match(tall, /\btranslate-y-0\b/, 'a vertical knob travels on the other axis');
});
