import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Badge } from './Badge.tsx';

test('Badge renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Badge>DRAFT</Badge>), /DRAFT/);
});

test('Badge renders the pair its tone names, not the neutral default', () => {
  const danger = renderToStaticMarkup(<Badge tone="danger">X</Badge>);
  assert.match(danger, /\bbg-error\/14\b/);
  assert.match(danger, /\btext-error\b/);
  assert.match(renderToStaticMarkup(<Badge tone="gold">X</Badge>), /\btext-secondary\b/);
  assert.doesNotMatch(danger, /\btext-base-content\/82\b/);
});

test('an unknown tone falls back to neutral rather than drawing no colour at all', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.match(renderToStaticMarkup(<Badge tone="chartreuse">X</Badge>), /\bbg-base-300\b/);
});

test('Badge draws the dot only when asked, and it takes the tone from the text colour', () => {
  assert.doesNotMatch(renderToStaticMarkup(<Badge>X</Badge>), /\bbg-current\b/);
  assert.match(renderToStaticMarkup(<Badge dot>X</Badge>), /\bbg-current\b/);
});

test('Badge drops a consumer style object and a consumer attribute, each independently', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Badge style={{ color: '#ff00ff' }} data-stray="x">X</Badge>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
