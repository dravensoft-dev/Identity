import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Input } from '../components/forms/Input.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a change or a blur. Two things are therefore NOT verified by this suite:
 * the `change` and `blur` payloads -- the value as a string, which is the whole of
 * decision DA -- and the validate-on-blur path, since `validate` runs only once the
 * field has been touched and nothing here can touch it. Both need a real DOM and are
 * Plan E territory; no grep of the source stands in for a render assertion, so they
 * are simply absent rather than faked.
 *
 * What IS verified is the half SSR can see: that `validate` is accepted and shows
 * nothing before interaction, that the flattened natives reach the control now that
 * {...rest} is gone, that `icon` and `prefix` are strings Arena draws, and that the
 * two R4 escapes are gone.
 *
 * React's SSR does not emit attributes in source order -- `value` comes out after
 * `style`, which is declared before it -- so each attribute is asserted on its own
 * rather than as one adjacent run. It also emits `autoComplete` and `maxLength`
 * camelCased on an <input> while lowercasing `readonly`, `disabled` and `required`. */

test('validate is accepted and shows no message before the field has been touched', () => {
  const html = renderToStaticMarkup(
    <Input label="Email" validate={() => 'Bad email'} value="x" />,
  );
  assert.match(html, /Email/);
  assert.doesNotMatch(html, /Bad email/, 'validate ran before blur');
});

test('type reaches the native control as its type attribute', () => {
  assert.match(renderToStaticMarkup(<Input label="When" type="date" />), /type="date"/);
});

test('the icon class is drawn on an <i> and hidden from assistive tech', () => {
  const html = renderToStaticMarkup(<Input label="Search" icon="ph-bold ph-magnifying-glass" />);
  assert.match(html, /<i[^>]*class="ph-bold ph-magnifying-glass"/);
  assert.match(html, /<i[^>]*aria-hidden="true"/);
});

test('prefix renders its string before the control', () => {
  const html = renderToStaticMarkup(<Input label="Repository" prefix="git@" />);
  assert.match(html, /<span[^>]*>git@<\/span>/);
});

test('placeholder, name and autoComplete each reach the native input', () => {
  const html = renderToStaticMarkup(
    <Input label="Email" placeholder="you@example.com" name="email" autoComplete="email" />,
  );
  assert.match(html, /placeholder="you@example.com"/);
  assert.match(html, /name="email"/);
  /* React emits autoComplete camelCased on an <input>, unlike readonly/disabled. */
  assert.match(html, /autoComplete="email"/);
});

test('min, max, step, maxLength and pattern each reach the native input', () => {
  const html = renderToStaticMarkup(
    <Input label="Count" type="number" min="1" max="9" step="2" maxLength={20} pattern="[0-9]+" />,
  );
  assert.match(html, /min="1"/);
  assert.match(html, /max="9"/);
  assert.match(html, /step="2"/);
  assert.match(html, /maxLength="20"/);
  assert.match(html, /pattern="\[0-9\]\+"/);
});

test('readOnly, disabled and required each reach the native input', () => {
  const html = renderToStaticMarkup(<Input label="Slug" readOnly disabled required />);
  assert.match(html, /readonly=""/);
  assert.match(html, /disabled=""/);
  assert.match(html, /required=""/);
});

test('value reaches the native input as the controlled text', () => {
  assert.match(renderToStaticMarkup(<Input label="Slug" value="customer-portal" />), /value="customer-portal"/);
});

test('the label wires htmlFor to the id the component generates from the label text', () => {
  const html = renderToStaticMarkup(<Input label="Deploy date" />);
  assert.match(html, /<label for="in-deploy-date"/);
  assert.match(html, /<input id="in-deploy-date"/);
});

test('error renders below the field and marks the control invalid', () => {
  const html = renderToStaticMarkup(<Input label="Email" error="Invalid format" hint="Ignored" />);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /Invalid format/);
  assert.doesNotMatch(html, /Ignored/);
});

/* className left the API (decision DE): the component keeps its own class and no
 * longer merges a consumer's into it. Nothing else guards that removal -- check:api
 * reads the .d.ts and the .jsx could start merging again with the gate still green. */
test('a consumer className does not reach the input -- its class is exactly arena-input', () => {
  const html = renderToStaticMarkup(<Input label="A" className="mine" />);
  assert.match(html, /class="arena-input"/);
  assert.doesNotMatch(html, /mine/, 'a consumer className was merged into the input class');
});

/* R4: style and {...rest} left the component. Asserted in two separate tests --
 * a component that stopped spreading ...rest but still merged ...style passes a
 * single combined assertion, because node:assert throws on the first failure and
 * the second one is never reached. */
test('Input drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<Input label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Input drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Input label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered input -- the {...rest} escape is back');
});
