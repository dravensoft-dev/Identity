import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Input } from './Input.tsx';

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
  assert.match(html, /<i[^>]*class="ph-bold ph-magnifying-glass [^"]*"/,
    "the Phosphor class the consumer named leads, and the manifest's icon slot follows it");
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

test('a consumer className does not reach the input -- its class is the manifest\'s and nothing else', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Input label="A" className="mine" />);
  assert.match(html, /<input[^>]*class="[^"]*\barena-input__input\b[^"]*"/);
  assert.doesNotMatch(html, /mine/, 'a consumer className was merged into the input class');
});

test('the picker indicator is styled by the manifest, so nothing injects a stylesheet for it', () => {
  const html = renderToStaticMarkup(<Input label="When" type="date" />);
  assert.match(html, /arena-input__input/,
    'the vendor pseudo-element is an arbitrary variant of the manifest now');
  assert.doesNotMatch(html, /\barena-input\b/, 'the hook class the injected sheet needed is gone with it');
});

test('the three field states are three branches of one recipe', () => {
  const neutral = renderToStaticMarkup(<Input label="A" />);
  assert.match(neutral, /(?:arena-input__field--state-neutral|arena-input__field--state-valid)/, 'focus is a modifier, not a reported state');
  assert.match(neutral, /\barena-input__field--state-neutral\b/);

  const bad = renderToStaticMarkup(<Input label="A" error="Nope" />);
  assert.match(bad, /\barena-input__field--state-error\b/);
  assert.match(bad, /\b(?:arena-input__error|arena-input__status-icon--state-error)\b/);

  const good = renderToStaticMarkup(<Input label="A" valid />);
  assert.match(good, /\barena-input__field--state-valid\b/);
  assert.match(good, /\barena-input__status-icon--state-valid\b/);
});

test('Input drops a consumer style object -- the ...style escape is gone', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Input label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Input drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Input label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered input -- the {...rest} escape is back');
});

test('a consumer id overrides the one generated from the label', () => {
  const html = renderToStaticMarkup(<Input label="Email" id="signup-email" />);
  assert.match(html, /id="signup-email"/);
  assert.match(html, /for="signup-email"/);
  assert.doesNotMatch(html, /in-email/, 'the generated id is still being used despite an explicit one');
});

test('without a consumer id the label-derived one is still generated', () => {
  const html = renderToStaticMarkup(<Input label="Email" />);
  assert.match(html, /id="in-email"/);
  assert.match(html, /for="in-email"/);
});
