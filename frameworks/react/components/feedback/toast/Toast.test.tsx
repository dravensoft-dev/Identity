import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Toast, TOAST_DISMISS } from './Toast.tsx';
import { dismissDefault, dismissActionable } from '../../../Tokens.generated.js';

test('actionLabel renders a real button carrying that label', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" actionLabel="Undo" onAction={() => {}} />);
  assert.match(html, /<button[^>]*>Undo<\/button>/, 'actionLabel did not render an action button');
});

test('a handler with no actionLabel renders no action button -- the label is what draws it', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" onAction={() => {}} />);
  assert.doesNotMatch(html, /<button/, 'an action button rendered from onAction alone, with no label to put in it');
});

test('dismissible shows the x, and it is the standard ph-x glyph', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" dismissible onClose={() => {}} />);
  assert.match(html, /aria-label="Close"/, 'dismissible did not render the close button');
  assert.match(html, /ph-bold ph-x/, 'the close button did not use the standard ph-x dismiss glyph');
});

test('onClose without dismissible shows no x -- the listener no longer gates the button', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" onClose={() => {}} />);
  assert.doesNotMatch(html, /<button/, 'the x rendered from an onClose listener alone -- the pre-EJ gate is back');
});

test('persist renders the Pinned marker, and its absence renders none', () => {
  const pinned = renderToStaticMarkup(<Toast title="Pipeline failed" persist />);
  assert.match(pinned, />Pinned</, 'persist did not render the Pinned marker');
  assert.match(pinned, /data-persist=""/);
  const transient = renderToStaticMarkup(<Toast title="Pipeline failed" />);
  assert.doesNotMatch(transient, />Pinned</, 'a transient toast drew the Pinned marker');
  assert.doesNotMatch(transient, /data-persist/);
});

test('the danger tone announces assertively as an alert', () => {
  const html = renderToStaticMarkup(<Toast tone="danger" title="Pipeline failed" />);
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /\barena-toast__root--tone-danger\b/, 'the danger tone did not reach the side bar');
});

test('every other tone announces politely as a status', () => {
  const expected = { neutral: 'arena-toast__root--tone-neutral', success: 'arena-toast__root--tone-success', gold: 'arena-toast__root--tone-gold' };
  for (const [tone, token] of Object.entries(expected)) {
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    const html = renderToStaticMarkup(<Toast tone={tone} title="Deployment archived" />);
    assert.match(html, /role="status"/, `tone="${tone}" announced as an alert`);
    assert.match(html, /aria-live="polite"/, `tone="${tone}" announced assertively`);
    assert.ok(new RegExp(`\\b${token}\\b`).test(html), `tone="${tone}" did not reach the side bar as ${token}`);
  }

  assert.match(renderToStaticMarkup(<Toast title="Deployment archived" />), /role="status"/);
});

test('Toast drops a consumer style object -- the ...style escape is gone', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Toast title="Deployment archived" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Toast drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

test('TOAST_DISMISS carries the two token intervals, and the actionable one is the longer', () => {
  assert.deepEqual({ ...TOAST_DISMISS }, { default: dismissDefault, actionable: dismissActionable });
  assert.ok(TOAST_DISMISS.actionable > TOAST_DISMISS.default,
    'a notice carrying a button asks the reader to decide rather than only to read, so it lives longer');
});
