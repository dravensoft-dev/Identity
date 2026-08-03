import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Checkbox } from './Checkbox.tsx';

test('the native input carries checked when checked is true', () => {
  const html = renderToStaticMarkup(<Checkbox checked label="Notify" />);
  assert.match(html, /<input type="checkbox"[^>]*checked=""/);
});

test('the native input carries no checked attribute when checked is false', () => {
  const html = renderToStaticMarkup(<Checkbox checked={false} label="Notify" />);
  assert.doesNotMatch(html, /checked=""/);
});

test('checked draws the crimson fill; unchecked draws the input surface', () => {
  const on = renderToStaticMarkup(<Checkbox checked label="Notify" />);
  const off = renderToStaticMarkup(<Checkbox label="Notify" />);
  assert.match(on, /\bbg-primary\b/);
  assert.match(on, /\bborder-primary\b/);
  assert.match(off, /\bbg-base-300\b/);
  assert.match(off, /\bborder-neutral\b/);
});

test('the focus ring is a selector on the box, so nothing injects a stylesheet to reach the input', () => {
  const html = renderToStaticMarkup(<Checkbox label="Notify" />);
  assert.match(html, /has\(~input:focus-visible\)/);
  assert.doesNotMatch(html, /\barena-check-box\b/, 'the hook class the injected sheet needed is gone with it');
});

test('the check mark takes its size, its colour and its stroke from one slot', () => {
  const html = renderToStaticMarkup(<Checkbox checked label="Notify" />);
  assert.match(html, /<svg class="size-3 text-primary-content \[stroke-width:var\(--bw-strong\)\]"/);
  assert.match(html, /stroke="currentColor"/, 'the path takes the colour the slot sets rather than naming one');
});

test('name, value and required reach the native input', () => {
  const html = renderToStaticMarkup(<Checkbox name="terms" value="accepted" required label="Accept" />);
  assert.match(html, /name="terms"/);
  assert.match(html, /value="accepted"/);
  assert.match(html, /required=""/);
});

test('label renders beside the box', () => {
  const html = renderToStaticMarkup(<Checkbox label="Notify on approval" />);
  assert.match(html, /Notify on approval/);
});

test('Checkbox drops a consumer style object -- the ...style escape is gone', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Checkbox label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Checkbox drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Checkbox label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
