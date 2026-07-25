import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Textarea } from '../components/forms/Textarea.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a change. The `change` event's payload -- the new text as a string -- is
 * therefore NOT verified by this suite, AND NOT ANYWHERE ELSE EITHER. It was, by
 * frameworks/react/test-dom/form-control-events.test.jsx, which dispatched a real
 * input event and asserted the payload's TYPE before its value; that directory was
 * deleted for its RAM cost and React's DOM behaviour is now checked by eye against
 * the demo page. See CLAUDE.md's Known debt. What IS verified here is
 * the half SSR can see:
 * that the native members the flattened heritage clause kept (placeholder, name,
 * readOnly, rows, maxLength, disabled, required, value) are forwarded explicitly now
 * that {...rest} is gone, that the counter is gated on maxLength, and that the label
 * still wires htmlFor to the id the component generates.
 *
 * React's SSR does not emit attributes in source order, so each attribute is asserted
 * on its own rather than as one adjacent run. */

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
  /* React emits maxLength camelCased on a <textarea>, unlike readonly/disabled. */
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

/* R4: style and {...rest} left the component. Asserted in two separate tests --
 * a component that stopped spreading ...rest but still merged ...style passes a
 * single combined assertion, because node:assert throws on the first failure and
 * the second one is never reached. */
test('Textarea drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<Textarea label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Textarea drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Textarea label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered textarea -- the {...rest} escape is back');
});

/* id is a contracted member as of plan 8C3, and it is the ONE global attribute
 * that is. The component still generates one from the label to wire its own
 * htmlFor; a consumer id overrides that, because a host pointing an external
 * <label> or an aria-describedby at this field had no path at all otherwise. */
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
