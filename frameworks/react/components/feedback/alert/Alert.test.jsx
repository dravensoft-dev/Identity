import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Alert } from '../components/feedback/Alert.jsx';

test('tone=danger renders role=alert; every other tone renders role=status', () => {
  const danger = renderToStaticMarkup(<Alert tone="danger">Renew the certificate</Alert>);
  assert.match(danger, /role="alert"/);

  const info = renderToStaticMarkup(<Alert tone="info">All good</Alert>);
  assert.match(info, /role="status"/);
});

test('actionLabel renders an action button with that label; absent renders no action', () => {
  const withAction = renderToStaticMarkup(
    <Alert tone="warning" actionLabel="Go to production" onAction={() => {}}>Changes here don't affect real users.</Alert>
  );
  assert.match(withAction, /<button/);
  assert.match(withAction, /Go to production/);

  const withoutAction = renderToStaticMarkup(<Alert tone="warning">No action here.</Alert>);
  assert.doesNotMatch(withoutAction, /<button/);
});

test('dismissible gates the close button; absent (even with onClose) renders no close button', () => {
  const dismissible = renderToStaticMarkup(<Alert dismissible onClose={() => {}}>Dismiss me</Alert>);
  assert.match(dismissible, /aria-label="Dismiss"/);

  const notDismissible = renderToStaticMarkup(<Alert onClose={() => {}}>Cannot dismiss me</Alert>);
  assert.doesNotMatch(notDismissible, /aria-label="Dismiss"/);
});

test('icon overrides the tone default glyph', () => {
  const html = renderToStaticMarkup(<Alert tone="success" icon="ph-fill ph-rocket">Shipped</Alert>);
  assert.match(html, /class="ph-fill ph-rocket"/);
  assert.doesNotMatch(html, /ph-check-circle/);
});
