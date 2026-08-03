import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Textarea } from './Textarea.tsx';

test('placeholder, name, readOnly and rows each reach the native textarea', () => {
  const html = renderToStaticMarkup(
    <Textarea label="Notes" placeholder="Say something" name="notes" readOnly rows={5} />,
  );
  assert.match(html, /placeholder="Say something"/);
  assert.match(html, /name="notes"/);
  assert.match(html, /readonly=""/);
  assert.match(html, /rows="5"/);
});

test('maxLength, disabled and required each reach the native textarea', () => {
  const html = renderToStaticMarkup(<Textarea label="Notes" maxLength={280} disabled required />);

  assert.match(html, /maxLength="280"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /required=""/);
});

test('counter renders the count over maxLength when both counter and maxLength are set', () => {
  const html = renderToStaticMarkup(<Textarea label="Notes" counter maxLength={280} value="abcd" />);
  assert.match(html, /4\/280/);
});

test('counter alone renders no count -- the condition is counter AND maxLength', () => {
  const html = renderToStaticMarkup(<Textarea label="Notes" counter value="abcd" />);
  assert.doesNotMatch(html, /\d+\/\d+/);
});

test('maxLength alone renders no count', () => {
  const html = renderToStaticMarkup(<Textarea label="Notes" maxLength={280} value="abcd" />);
  assert.doesNotMatch(html, /4\/280/);
});

test('the label wires htmlFor to the id the component generates from the label text', () => {
  const html = renderToStaticMarkup(<Textarea label="Deployment notes" />);
  assert.match(html, /<label for="ta-deployment-notes"/);
  assert.match(html, /<textarea id="ta-deployment-notes"/);
});

test('error renders below the field and marks the control invalid', () => {
  const html = renderToStaticMarkup(<Textarea label="Notes" error="Too long" hint="Ignored" />);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /Too long/);
  assert.doesNotMatch(html, /Ignored/);
});

test('Textarea drops a consumer style object -- the ...style escape is gone', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Textarea label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Textarea drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Textarea label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered textarea -- the {...rest} escape is back');
});

test('a consumer id overrides the one generated from the label', () => {
  const html = renderToStaticMarkup(<Textarea label="Email" id="signup-email" />);
  assert.match(html, /<textarea id="signup-email"/);
  assert.match(html, /for="signup-email"/);
  assert.doesNotMatch(html, /ta-email/, 'the generated id is still being used despite an explicit one');
});

test('without a consumer id the label-derived one is still generated', () => {
  const html = renderToStaticMarkup(<Textarea label="Email" />);
  assert.match(html, /<textarea id="ta-email"/);
  assert.match(html, /for="ta-email"/);
});

test('the counter warns near the cap through its own slot, not a recomputed colour', () => {
  const calm = renderToStaticMarkup(<Textarea label="A" counter maxLength={100} value={'x'.repeat(50)} />);
  assert.match(calm, /50\/100/);
  assert.doesNotMatch(calm, /\barena-textarea__counter-near\b/);

  const near = renderToStaticMarkup(<Textarea label="A" counter maxLength={100} value={'x'.repeat(95)} />);
  assert.match(near, /\barena-textarea__counter-near\b/);
});

test('autoResize picks the resize branch of the recipe, and error picks the state branch', () => {
  assert.match(renderToStaticMarkup(<Textarea label="A" />), /\barena-textarea__field--resize-vertical\b/);
  assert.match(renderToStaticMarkup(<Textarea label="A" autoResize />), /\barena-textarea__field--resize-none\b/);
  assert.match(renderToStaticMarkup(<Textarea label="A" />), /arena-textarea__field/);
  assert.match(renderToStaticMarkup(<Textarea label="A" error="Nope" />), /\barena-textarea__field--state-error\b/);
});
