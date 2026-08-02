import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Button } from './Button.tsx';

test('Button renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Button>Deploy</Button>), /Deploy/);
});

test('Button draws icon before the label and iconRight after it', () => {
  const html = renderToStaticMarkup(
    <Button icon="ph-bold ph-plus" iconRight="ph-bold ph-caret-down">Deploy</Button>
  );
  assert.match(html, /ph-bold ph-plus[\s\S]*Deploy[\s\S]*ph-bold ph-caret-down/);
});

test('Button replaces the leading icon with the spinner while loading', () => {
  const html = renderToStaticMarkup(<Button icon="ph-bold ph-plus" loading>Deploy</Button>);
  assert.match(html, /arena-btn-spin/);
  assert.doesNotMatch(html, /ph-bold ph-plus/);
});

test('Button is disabled while loading, without being passed disabled', () => {
  assert.match(renderToStaticMarkup(<Button loading>Deploy</Button>), /disabled/);
});

test('Button defaults its native type to button and honours an override', () => {
  assert.match(renderToStaticMarkup(<Button>x</Button>), /type="button"/);
  assert.match(renderToStaticMarkup(<Button type="submit">x</Button>), /type="submit"/);
});

test('Button renders danger as outline, never filled', () => {
  const html = renderToStaticMarkup(<Button variant="danger">Delete</Button>);
  assert.match(html, /\bbg-transparent\b/, 'the danger surface is filled, and the convention is that it never is');
  assert.match(html, /\bborder-error\b/);
  assert.match(html, /\btext-error\b/);
  assert.doesNotMatch(html, /(?<!:)\bbg-error\b/,
    'an unmodified bg-error fills the danger surface; only the hover: form may tint it');
});

test('Button drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    <Button style={{ color: '#ff00ff' }} data-stray="x">x</Button>
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

test('tabStop defaults to true and emits no tabindex at all', () => {
  const html = renderToStaticMarkup(<Button>Save</Button>);
  assert.doesNotMatch(html, /tabindex/i, 'a default Button wrote a tabindex it does not need');
});

test('tabStop={false} takes the control out of the page Tab sequence', () => {
  const html = renderToStaticMarkup(<Button tabStop={false}>Save</Button>);
  assert.match(html, /tabindex="-1"/, 'tabStop={false} did not write tabindex="-1"');
});

test('tabStop is not forwarded to the DOM as an unknown attribute', () => {
  const html = renderToStaticMarkup(<Button tabStop={false}>Save</Button>);
  assert.doesNotMatch(html, /tabstop/i, 'the tabStop prop leaked into the markup');
});
