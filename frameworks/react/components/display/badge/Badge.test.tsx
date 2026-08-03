import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Badge } from './Badge.tsx';

test('Badge renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Badge>DRAFT</Badge>), /DRAFT/);
});

test('Badge renders the tone it was given, not the neutral default', () => {
  const danger = renderToStaticMarkup(<Badge tone="danger">X</Badge>);
  assert.match(danger, /\barena-badge__root--tone-danger\b/);
  assert.doesNotMatch(danger, /\barena-badge__root--tone-neutral\b/);
  assert.match(renderToStaticMarkup(<Badge tone="gold">X</Badge>), /\barena-badge__root--tone-gold\b/);
});

test('an unknown tone falls back to neutral rather than drawing no tone at all', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.match(renderToStaticMarkup(<Badge tone="chartreuse">X</Badge>), /\barena-badge__root--tone-neutral\b/);
});

test('Badge draws the dot only when asked', () => {
  assert.doesNotMatch(renderToStaticMarkup(<Badge>X</Badge>), /\barena-badge__dot\b/);
  assert.match(renderToStaticMarkup(<Badge dot>X</Badge>), /\barena-badge__dot\b/);
});

test('Badge drops a consumer style object and a consumer attribute, each independently', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Badge style={{ color: '#ff00ff' }} data-stray="x">X</Badge>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
