import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Select } from '../components/forms/Select.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a change. The `change` event's payload -- the chosen option's value as a
 * string -- is therefore NOT verified by this suite, AND NOT ANYWHERE ELSE EITHER.
 * It was, by frameworks/react/test-dom/form-control-events.test.jsx, which dispatched
 * a real change and asserted the payload's TYPE before its value; that directory was
 * deleted for its RAM cost and React's DOM behaviour is now checked by eye against
 * the demo page. See CLAUDE.md's Known debt. What IS verified here is the
 * half SSR can see: that an option's `value` and `label` are drawn into their own places now
 * that the bare-string branch is gone, that the native members the flattened heritage
 * clause kept (value, disabled, required, name, multiple) are forwarded explicitly now
 * that {...rest} is gone, and that the label still renders.
 *
 * React's SSR does not emit attributes in source order, so each attribute is asserted
 * on its own rather than as one adjacent run. */

test('an option draws its label as the text and its value as the attribute, and the two differ', () => {
  const html = renderToStaticMarkup(
    <Select label="Environment" options={[{ value: 'prod', label: 'Production' }]} />,
  );
  assert.match(html, /<option value="prod">Production<\/option>/);
  /* The fixture's value and label differ on purpose: a component that drew the value
   * as the option's text would still satisfy a same-string fixture. */
  assert.doesNotMatch(html, />prod</, 'the option drew its value as its text, not its label');
});

test('required, name and multiple each reach the native select', () => {
  const html = renderToStaticMarkup(
    <Select label="Environment" name="env" required multiple options={[{ value: 'qa', label: 'QA' }]} />,
  );
  assert.match(html, /required=""/);
  assert.match(html, /name="env"/);
  assert.match(html, /multiple=""/);
});

test('value marks the matching option selected and disabled reaches the native select', () => {
  const html = renderToStaticMarkup(
    <Select label="Environment" value="qa" disabled onChange={() => {}}
      options={[{ value: 'prod', label: 'Production' }, { value: 'qa', label: 'QA' }]} />,
  );
  assert.match(html, /<option value="qa" selected="">QA<\/option>/);
  assert.match(html, /disabled=""/);
});

test('label renders its text above the control', () => {
  const html = renderToStaticMarkup(<Select label="Environment" options={[]} />);
  assert.match(html, /<label[^>]*>Environment<\/label>/);
});

/* R4: style and {...rest} left the component. Asserted in two separate tests --
 * a component that stopped spreading ...rest but still merged ...style passes a
 * single combined assertion, because node:assert throws on the first failure and
 * the second one is never reached. */
test('Select drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(<Select label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Select drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Select label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered select -- the {...rest} escape is back');
});
