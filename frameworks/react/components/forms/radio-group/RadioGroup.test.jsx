import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { RadioGroup } from './RadioGroup.jsx';
import { Radio } from '../radio/Radio.jsx';

test('RadioGroup marks the child whose value matches, and only it', () => {
  const html = renderToStaticMarkup(
    <RadioGroup value="b"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>,
  );
  // The selected dot is a bare crimson span; exactly one appears.
  assert.equal(html.match(/border-radius:50%;background:var\(--crimson\)/g)?.length, 1);
});

test('RadioGroup gives its children a shared name so the native radios group', () => {
  const html = renderToStaticMarkup(
    <RadioGroup name="env"><Radio value="a" label="A" /><Radio value="b" label="B" /></RadioGroup>,
  );
  assert.equal(html.match(/name="env"/g)?.length, 2);
});

test('Radio renders its label and hint', () => {
  const html = renderToStaticMarkup(<RadioGroup><Radio value="a" label="Prod" hint="Real users" /></RadioGroup>);
  assert.match(html, /Prod/);
  assert.match(html, /Real users/);
});

test('Radio throws when value is absent -- the fail-hard guard', () => {
  assert.throws(
    () => renderToStaticMarkup(<RadioGroup><Radio label="A" /></RadioGroup>),
    /Radio: `value` is required/,
  );
});

/* R4: style and {...rest} left both components. Asserted in two separate tests --
 * a component that stopped spreading ...rest but still merged ...style passes a
 * single combined assertion, because node:assert throws on the first failure and
 * the second one is never reached. RadioGroup is the root that took both escapes. */
test('RadioGroup drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <RadioGroup style={{ color: '#ff00ff' }}><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('RadioGroup drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(
    <RadioGroup data-stray="x"><Radio value="a" label="A" /></RadioGroup>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
