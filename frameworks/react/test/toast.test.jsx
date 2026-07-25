import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Toast } from '../components/feedback/Toast.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a click: neither the `action` nor the `close` event's firing is verified.
 * What IS verified is the half SSR can see, and it is the half both of this
 * migration's decisions live in --
 *
 *   EF: ToastAction { label, onClick } was decomposed into `actionLabel` + `action`,
 *       because R1 makes a predefined object pure data with known fields and a
 *       callback is not data. So the BUTTON must come from the label alone.
 *   EJ: `dismissible` is what shows the x, not the presence of an onClose listener --
 *       Angular cannot detect a listener, so gating on one could never be a contract.
 *       Both directions are asserted, because that gate change is quiet and breaking.
 *
 * React's SSR does not emit attributes in source order, so nothing below assumes
 * adjacency between two attributes. */

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
  assert.match(html, /var\(--danger\)/, 'the danger tone did not reach the side bar');
});

test('every other tone announces politely as a status', () => {
  const expected = { neutral: 'var(--line-strong)', success: 'var(--success)', gold: 'var(--gold)' };
  for (const [tone, token] of Object.entries(expected)) {
    const html = renderToStaticMarkup(<Toast tone={tone} title="Deployment archived" />);
    assert.match(html, /role="status"/, `tone="${tone}" announced as an alert`);
    assert.match(html, /aria-live="polite"/, `tone="${tone}" announced assertively`);
    assert.ok(html.includes(token), `tone="${tone}" did not reach the side bar as ${token}`);
  }
  /* And the default is neutral, not danger. */
  assert.match(renderToStaticMarkup(<Toast title="Deployment archived" />), /role="status"/);
});

/* R4: `style` left the component, and there is no {...rest} to put it back. Asserted in
 * two separate tests -- node:assert aborts on the first failure, so one body asserting
 * both escapes cannot say which of them came back. */
test('Toast drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Toast drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<Toast title="Deployment archived" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});
