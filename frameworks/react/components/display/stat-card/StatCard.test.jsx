import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { StatCard } from './StatCard.jsx';

test('a delta with a value renders the pill', () => {
  const html = renderToStaticMarkup(
    <StatCard label="Deploys" value="128" delta={{ value: '+12%', direction: 'up', tone: 'positive' }} />,
  );
  assert.match(html, /\+12%/, 'the delta value itself must render');
  assert.match(html, /ph-arrow-up/, 'the pill\'s direction glyph must render');
});

test('a delta with a tone and direction but an empty value renders no pill at all', () => {
  const html = renderToStaticMarkup(
    <StatCard label="Deploys" value="128" delta={{ value: '', direction: 'up', tone: 'positive' }} />,
  );
  assert.doesNotMatch(html, /ph-arrow-up/, 'no direction glyph -- the pill must not render at all');
  assert.doesNotMatch(html, /ph-arrow-down/, 'no direction glyph in either direction');
});

test('no delta at all renders no pill either -- the same gate, at its other edge', () => {
  const html = renderToStaticMarkup(<StatCard label="Deploys" value="128" />);
  assert.doesNotMatch(html, /ph-arrow-up/);
  assert.doesNotMatch(html, /ph-arrow-down/);
});

test('an icon renders the glyph Arena draws, inside the aria-hidden wrapper', () => {
  const html = renderToStaticMarkup(<StatCard label="Deploys" value="128" icon="ph-bold ph-rocket" />);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /class="[^"]*ph-rocket/);
});

test('no icon renders no wrapper at all -- not an empty one', () => {
  const html = renderToStaticMarkup(<StatCard label="Deploys" value="128" />);
  assert.doesNotMatch(html, /aria-hidden="true"/);
});

test('throws when a required member is absent', () => {
  assert.throws(() => renderToStaticMarkup(<StatCard value="128" />), /label.*required/);
  assert.throws(() => renderToStaticMarkup(<StatCard label="Deploys" />), /value.*required/);
});
