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
import { Card } from './Card.jsx';

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

/* The action slot renders inside the header row, so it must appear when it is
 * the ONLY header member -- a card with an action but no title still draws a
 * header. --fs-h4 is the title's own size and is the header's title branch, so
 * asserting the action's own text alongside its absence discriminates the two
 * branches rather than merely proving a header exists. */
test('Card renders its action slot even with no title or eyebrow', () => {
  const html = renderToStaticMarkup(<Card action={<span>ACT</span>}>x</Card>);
  assert.match(html, /ACT/);
  assert.doesNotMatch(html, /var\(--fs-h4\)/);
});

/* R4: the `extends React.HTMLAttributes<HTMLDivElement>` heritage clause and
 * the `{...rest}` spread both left this component, and `style` went with the
 * heritage. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted separately -- see Spinner. */
test('Card drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(<Card style={{ color: '#ff00ff' }} data-stray="x">x</Card>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
