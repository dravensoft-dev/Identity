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

  assert.doesNotMatch(renderToStaticMarkup(<Card>x</Card>), /\btext-h4\b/);
  const titled = renderToStaticMarkup(<Card title="T">x</Card>);
  assert.match(titled, /\btext-h4\b/);
  assert.match(titled, /T/);
});

test('Card renders its action slot even with no title or eyebrow', () => {
  const html = renderToStaticMarkup(<Card action={<span>ACT</span>}>x</Card>);
  assert.match(html, /ACT/);
  assert.doesNotMatch(html, /\btext-h4\b/);
});

test('an interactive card carries the manifest\'s own hover and focus classes, not a JS state', () => {
  const inert = renderToStaticMarkup(<Card>x</Card>);
  assert.doesNotMatch(inert, /hover:bg-base-300/);
  assert.match(inert, /\bcursor-auto\b/);

  const live = renderToStaticMarkup(<Card interactive>x</Card>);
  assert.match(live, /hover:bg-base-300/);
  assert.match(live, /focus-visible:ring-2/);
  assert.match(live, /focus-visible:ring-primary/);
  assert.match(live, /aria-disabled:opacity-45/,
    'the disabled look is a state the attribute selects, so nothing has to be recomputed to draw it');
});

test('accent and floating each pick their branch of the surface', () => {
  assert.match(renderToStaticMarkup(<Card>x</Card>), /\bborder-base-300\b/);
  assert.match(renderToStaticMarkup(<Card accent>x</Card>), /\bborder-primary\b/);
  assert.match(renderToStaticMarkup(<Card>x</Card>), /\bshadow-none\b/);
  assert.match(renderToStaticMarkup(<Card floating>x</Card>), /\bshadow-2\b/);
});

test('an href card is interactive without being told so, because navigating IS acting', () => {
  const html = renderToStaticMarkup(<Card href="#x">x</Card>);
  assert.match(html, /hover:bg-base-300/);
});

test('Card drops a consumer style object and a consumer attribute, each independently', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Card style={{ color: '#ff00ff' }} data-stray="x">x</Card>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
