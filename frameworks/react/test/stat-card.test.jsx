/* The CHANGELOG advertises that the delta pill now gates on `delta.value` in
 * BOTH layers -- fixing React's own old empty-pill defect, where a delta
 * carrying a tone and a direction but an empty (falsy) `value` still rendered
 * an outline pill with nothing inside it. `frameworks/angular/test/
 * host-class-binding.test.ts` got a render test for exactly this
 * (`arena-stat-card: a delta with a value renders the pill; a delta with a
 * tone but no value renders nothing`); `StatCard.jsx` is the file that
 * changed on the React side, and it had none. This is that test, in this
 * layer's own DOM-free idiom -- `renderToStaticMarkup`, no fake event, no
 * DOM. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { StatCard } from '../components/display/StatCard.jsx';

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
