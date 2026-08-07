import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaAlert } from './ArenaAlert.tsx';

test('tone=danger renders role=alert; every other tone renders role=status', () => {
  const danger = renderToStaticMarkup(<ArenaAlert tone="danger">Renew the certificate</ArenaAlert>);
  assert.match(danger, /role="alert"/);

  const info = renderToStaticMarkup(<ArenaAlert tone="info">All good</ArenaAlert>);
  assert.match(info, /role="status"/);
});

test('actionLabel renders an action button with that label; absent renders no action', () => {
  const withAction = renderToStaticMarkup(
    <ArenaAlert tone="warning" actionLabel="Go to production" onAction={() => {}}>Changes here don't affect real users.</ArenaAlert>
  );
  assert.match(withAction, /<button/);
  assert.match(withAction, /Go to production/);

  const withoutAction = renderToStaticMarkup(<ArenaAlert tone="warning">No action here.</ArenaAlert>);
  assert.doesNotMatch(withoutAction, /<button/);
});

test('dismissible gates the close button; absent (even with onClose) renders no close button', () => {
  const dismissible = renderToStaticMarkup(<ArenaAlert dismissible onClose={() => {}}>Dismiss me</ArenaAlert>);
  assert.match(dismissible, /aria-label="Dismiss"/);

  const notDismissible = renderToStaticMarkup(<ArenaAlert onClose={() => {}}>Cannot dismiss me</ArenaAlert>);
  assert.doesNotMatch(notDismissible, /aria-label="Dismiss"/);
});

test('icon overrides the tone default glyph', () => {
  const html = renderToStaticMarkup(<ArenaAlert tone="success" icon="ph-fill ph-rocket">Shipped</ArenaAlert>);
  assert.match(html, /class="ph-fill ph-rocket [^"]*"/,
    "the icon the consumer named leads, and the manifest's icon slot tones it");
  assert.doesNotMatch(html, /ph-check-circle/);
});
