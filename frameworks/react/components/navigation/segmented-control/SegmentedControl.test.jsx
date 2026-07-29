import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SegmentedControl } from './SegmentedControl.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a change. The `change` event's payload -- the chosen option's value as a
 * string -- is therefore NOT verified by this suite. What IS verified is the half SSR
 * can see: that an option's `value` and `label` are drawn into their own places now
 * that the bare-string branch is gone, that `value` selects exactly one option, that
 * the required `ariaLabel` fails hard when absent, and that neither R4 escape is left.
 *
 * Every fixture's value and label DIFFER on purpose. A same-string fixture cannot
 * discriminate a component that draws the value as the segment's text.
 *
 * React's SSR does not emit attributes in source order -- measured here, the hidden
 * radio emits type, name, style, checked, value, in that order -- so each attribute is
 * asserted on its own rather than as one adjacent run. */

test('an option draws its label as its text and its value onto the hidden radio, and the two differ', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="Time range" name="tr"
      options={[{ value: 'ov', label: 'Overview' }, { value: 'dp', label: 'Deployments' }]} />,
  );
  assert.match(html, /<label[^>]*>Overview<input[^>]*\/><\/label>/);
  assert.match(html, /<input[^>]*value="ov"[^>]*\/>/);
  assert.match(html, /<input[^>]*value="dp"[^>]*\/>/);
  assert.doesNotMatch(html, />ov</, 'an option drew its value as its text, not its label');
});

test('value selects the option whose `value` matches, and only it is checked and raised', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="Time range" name="tr" value="dp" onChange={() => {}}
      options={[{ value: 'ov', label: 'Overview' }, { value: 'dp', label: 'Deployments' }]} />,
  );
  /* The raised thumb sits on Deployments -- so the selection was keyed off `value`,
   * not off the label, which is a different string. */
  assert.match(html, /<label[^>]*var\(--shadow-1\)[^>]*>Deployments</);
  /* And on nothing else, counted: asserting presence alone passes a component that
   * raises every segment. */
  assert.equal((html.match(/var\(--shadow-1\)/g) || []).length, 1,
    'more than one segment wore the raised thumb');
  assert.equal((html.match(/checked=""/g) || []).length, 1,
    'more than one radio was checked');
});

/* `options` is declared required in the contract, and api/README.md's
 * required-ness rule says the implementation fails hard rather than rendering
 * with a missing value. It guards absence only -- an empty array is a caller
 * saying "no options right now", which every other required-array guard in the
 * layer accepts. */
test('options is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<SegmentedControl ariaLabel="Time range" />),
    /SegmentedControl: `options` is required/,
  );
});

test('an empty options array renders rather than throwing', () => {
  const html = renderToStaticMarkup(<SegmentedControl ariaLabel="Time range" options={[]} />);
  assert.match(html, /role="radiogroup"/);
});

test('ariaLabel is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<SegmentedControl options={[{ value: 'ov', label: 'Overview' }]} />),
    /SegmentedControl: `ariaLabel` is required/,
  );
});

test('ariaLabel names the radio group', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="Time range" options={[{ value: 'ov', label: 'Overview' }]} />,
  );
  assert.match(html, /<div[^>]*role="radiogroup"[^>]*>/);
  assert.match(html, /<div[^>]*aria-label="Time range"[^>]*>/);
});

/* R4: `style` and the {...rest} spread left the component. Asserted in two separate
 * tests -- node:assert aborts on the first failure, so a component that stopped
 * spreading ...rest but still merged ...style passes a single combined assertion. */
test('SegmentedControl drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="A" options={[{ value: 'ov', label: 'Overview' }]}
      style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SegmentedControl drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="A" options={[{ value: 'ov', label: 'Overview' }]} data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
