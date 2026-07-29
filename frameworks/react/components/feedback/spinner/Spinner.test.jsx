import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Spinner } from './Spinner.jsx';

test('Spinner announces its label through an explicitly polite progressbar', () => {
  const html = renderToStaticMarkup(<Spinner label="Loading deploys" />);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-live="polite"/,
    'role="progressbar" carries no implicit live region, so dropping the explicit aria-live '
    + 'silently removes the announcement role="status" used to provide');
  assert.match(html, /aria-label="Loading deploys"/);
});

test('Spinner falls back to "Loading" when no label is given', () => {
  assert.match(renderToStaticMarkup(<Spinner />), /aria-label="Loading"/);
});

test('Spinner renders the diameter token its size names, not the default', () => {
  assert.match(renderToStaticMarkup(<Spinner size="sm" />), /var\(--icon-sm\)/);
  assert.match(renderToStaticMarkup(<Spinner size="lg" />), /var\(--sp-8\)/);
});

test('Spinner renders the colour token its tone names', () => {
  assert.match(renderToStaticMarkup(<Spinner tone="on-accent" />), /var\(--on-accent\)/);
  assert.match(renderToStaticMarkup(<Spinner tone="gold" />), /var\(--gold\)/);
});

test('Spinner drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <Spinner style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
