import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SegmentedControl } from './SegmentedControl.tsx';

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

  assert.match(html, /<label[^>]*\barena-segmented-control__segment--selected-true\b[^>]*>Deployments</);

  assert.equal((html.match(/\barena-segmented-control__segment--selected-true\b/g) || []).length, 1,
    'more than one segment wore the raised thumb');
  assert.equal((html.match(/checked=""/g) || []).length, 1,
    'more than one radio was checked');
});

test('options is required and its absence throws', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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

test('SegmentedControl drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="A" options={[{ value: 'ov', label: 'Overview' }]}
      // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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

test('the track takes its focus ring from focus-within, so no segment reports focus to a state', () => {
  const html = renderToStaticMarkup(
    <SegmentedControl ariaLabel="Time range" name="tr" value="ov"
      options={[{ value: 'ov', label: 'Overview' }, { value: 'dp', label: 'Deployments' }]} />,
  );
  assert.match(html, /arena-segmented-control__track/);
  assert.match(html, /arena-segmented-control__segment--selected-false/, 'and an unselected segment lifts through a modifier');
  assert.doesNotMatch(html, /<label[^>]*\barena-segmented-control__segment--selected-true\b[^>]*>Deployments</,
    'the unselected segment draws no thumb');
});
