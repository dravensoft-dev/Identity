import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { UnauthCard } from '../components/display/UnauthCard.jsx';

test('it renders its slots and its children', () => {
  const html = renderToStaticMarkup(
    <UnauthCard brand={<span>BRAND</span>} eyebrow="Delivery console" title="Welcome back"
      footer={<a href="/reset">Forgot your password?</a>}>
      <span>FIELDS</span>
    </UnauthCard>);
  assert.match(html, /BRAND/);
  assert.match(html, /Delivery console/);
  assert.match(html, /Welcome back/);
  assert.match(html, /FIELDS/);
  assert.match(html, /Forgot your password\?/);
});

test('every slot is optional — a bare panel of children still renders', () => {
  const html = renderToStaticMarkup(<UnauthCard><span>FIELDS</span></UnauthCard>);
  assert.match(html, /FIELDS/);
});

test('it constrains its own width and does not centre itself', () => {
  const html = renderToStaticMarkup(<UnauthCard><span>x</span></UnauthCard>);
  assert.match(html, /max-width/);
  assert.doesNotMatch(html, /justify-content/);
  assert.doesNotMatch(html, /min-height/);
});

test('it renders Card rather than a second panel definition', () => {
  const html = renderToStaticMarkup(<UnauthCard><span>x</span></UnauthCard>);
  // Not just the tokens (a hand-rolled div can carry the same two tokens and pass
  // that check) but Card's actual structure: the surface/border/radius div ends in
  // `overflow:hidden`, and — because Card pads its content at calc(var(--sp-1) * 5)
  // unconditionally, even with no title/eyebrow/action — that div is immediately
  // followed by a nested div carrying that padding, itself wrapping UnauthCard's own
  // calc(var(--sp-1) * 4) padding div. A hand-rolled panel has no reason to reproduce
  // that unconditional double-padding nesting; only composing the real Card does.
  assert.match(
    html,
    /overflow:hidden"><div style="padding:calc\(var\(--sp-1\) \* 5\)"><div style="padding:calc\(var\(--sp-1\) \* 4\)"/
  );
});
