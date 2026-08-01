import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Badge } from './Badge.tsx';

test('Badge renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Badge>DRAFT</Badge>), /DRAFT/);
});

test('Badge renders the token pair its tone names, not the neutral default', () => {
  assert.match(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--danger\)/);
  assert.match(renderToStaticMarkup(<Badge tone="gold">X</Badge>), /var\(--gold\)/);
  assert.doesNotMatch(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--bone-dim\)/);
});

test('Badge draws the dot only when asked', () => {
  assert.doesNotMatch(renderToStaticMarkup(<Badge>X</Badge>), /50%/);
  assert.match(renderToStaticMarkup(<Badge dot>X</Badge>), /50%/);
});

test('Badge drops a consumer style object and a consumer attribute, each independently', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Badge style={{ color: '#ff00ff' }} data-stray="x">X</Badge>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
