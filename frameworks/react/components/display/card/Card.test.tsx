import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Card } from './Card.tsx';

test('Card renders its children', () => {
  const html = renderToStaticMarkup(<Card>hello</Card>);
  assert.match(html, /hello/);
});

test('Card renders no header block when it has no title, eyebrow or action', () => {

  assert.doesNotMatch(renderToStaticMarkup(<Card>x</Card>), /var\(--fs-h4\)/);
  const titled = renderToStaticMarkup(<Card title="T">x</Card>);
  assert.match(titled, /var\(--fs-h4\)/);
  assert.match(titled, /T/);
});

test('Card renders its action slot even with no title or eyebrow', () => {
  const html = renderToStaticMarkup(<Card action={<span>ACT</span>}>x</Card>);
  assert.match(html, /ACT/);
  assert.doesNotMatch(html, /var\(--fs-h4\)/);
});

test('Card drops a consumer style object and a consumer attribute, each independently', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Card style={{ color: '#ff00ff' }} data-stray="x">x</Card>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
