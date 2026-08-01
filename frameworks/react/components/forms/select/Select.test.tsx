import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Select } from './Select.tsx';

test('an option draws its label as the text and its value as the attribute, and the two differ', () => {
  const html = renderToStaticMarkup(
    <Select label="Environment" options={[{ value: 'prod', label: 'Production' }]} />,
  );
  assert.match(html, /<option value="prod">Production<\/option>/);

  assert.doesNotMatch(html, />prod</, 'the option drew its value as its text, not its label');
});

test('required and name each reach the native select', () => {
  const html = renderToStaticMarkup(
    <Select label="Environment" name="env" required options={[{ value: 'qa', label: 'QA' }]} />,
  );
  assert.match(html, /required=""/);
  assert.match(html, /name="env"/);
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

test('Select drops a consumer style object -- the ...style escape is gone', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<Select label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Select drops a consumer attribute -- the {...rest} escape is gone', () => {
  const html = renderToStaticMarkup(<Select label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered select -- the {...rest} escape is back');
});
