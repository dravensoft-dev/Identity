import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Spinner } from './Spinner.tsx';

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

test('Spinner renders the diameter its size names, not the default', () => {
  assert.match(renderToStaticMarkup(<Spinner size="sm" />), /\barena-spinner__circle--size-sm\b/);
  assert.match(renderToStaticMarkup(<Spinner size="lg" />), /\barena-spinner__circle--size-lg\b/);
  assert.doesNotMatch(renderToStaticMarkup(<Spinner size="lg" />), /\barena-spinner__circle--size-md\b/);
});

test('Spinner renders the colour its tone names, and the ring takes it from currentColor', () => {
  assert.match(renderToStaticMarkup(<Spinner tone="on-accent" />), /\barena-spinner__root--tone-on-accent\b/);
  assert.match(renderToStaticMarkup(<Spinner tone="gold" />), /\barena-spinner__root--tone-gold\b/);
  assert.match(renderToStaticMarkup(<Spinner />), /\barena-spinner__circle\b/,
    'the ring reads the tone off the root rather than naming a colour of its own');
});

test('the spin is the shared utility, so the reduced-motion slowdown is not a second copy', () => {
  const html = renderToStaticMarkup(<Spinner />);
  assert.match(html, /\barena-spinner__circle\b/,
    'motion reporting work in progress slows rather than stops, and the utility is where that is said');
});

test('Spinner drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    <Spinner style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
