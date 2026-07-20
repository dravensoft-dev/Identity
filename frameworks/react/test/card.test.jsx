/* The React layer's test suite. Components here render with inline style
 * objects reading custom properties, so a test asserts on the markup a render
 * produces -- renderToStaticMarkup, not a DOM -- which is enough to check
 * structure, conditional branches, and that a value resolves to var(--token)
 * rather than to a number.
 *
 * It deliberately does NOT assert computed pixels: nothing here loads
 * styles.css, and a test that resolved --sp-1 would be testing the browser.
 * The token layer's own gates (check:dimensions, check:tokens) are what hold
 * the values; this suite holds the behaviour. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Card } from '../components/display/Card.jsx';

test('Card renders its children', () => {
  const html = renderToStaticMarkup(<Card>hello</Card>);
  assert.match(html, /hello/);
});

test('Card renders no header block when it has no title, eyebrow or action', () => {
  /* --fs-h4 is the title's own font size and appears nowhere else in Card, so
   * its absence is the header block's absence -- a length comparison would
   * pass for any two strings of different size and assert almost nothing. */
  assert.doesNotMatch(renderToStaticMarkup(<Card>x</Card>), /var\(--fs-h4\)/);
  const titled = renderToStaticMarkup(<Card title="T">x</Card>);
  assert.match(titled, /var\(--fs-h4\)/);
  assert.match(titled, /T/);
});
