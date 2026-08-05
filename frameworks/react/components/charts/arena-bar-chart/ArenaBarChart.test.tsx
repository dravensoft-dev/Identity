import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { ArenaBarChart } from './ArenaBarChart.tsx';

const LABELS = ['Mon', 'Tue', 'Wed'];
const VALUES = [12, 30, 7];

test('ArenaBarChart appends valueSuffix to the axis ticks and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <ArenaBarChart labels={LABELS} values={VALUES} seriesLabel="Deploys" valueSuffix=" ms" />
  );

  assert.match(html, />12\.5 ms</, 'the axis tick carries the suffix');
  assert.match(html, />37\.5 ms</, 'the axis tick carries the suffix');

  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v} ms</td>`), `the ${v} row carries the suffix`);
});

test('ArenaBarChart with no valueSuffix draws bare numbers, so the suffix is genuinely optional', () => {
  const html = renderToStaticMarkup(<ArenaBarChart seriesLabel="Deployments per week" labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('ArenaBarChart throws when labels is absent, which required-ness demands of every layer', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<ArenaBarChart seriesLabel="Deployments per week" values={VALUES} />),
    /ArenaBarChart: `labels` is required/,
  );
});

test('ArenaBarChart throws when values is absent, which required-ness demands of every layer', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<ArenaBarChart seriesLabel="Deployments per week" labels={LABELS} />),
    /ArenaBarChart: `values` is required/,
  );
});

test('ArenaBarChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    <ArenaBarChart seriesLabel="Deployments per week" labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

test('ArenaBarChart drops a label with no value at its index, rather than drawing it over empty plot', () => {
  const html = renderToStaticMarkup(
    <ArenaBarChart seriesLabel="Deployments per week" labels={['Alpha', 'Beta', 'SURPLUS']} values={[10, 20]} />
  );
  assert.doesNotMatch(html, /SURPLUS/, 'a label with no value at its index reached the category axis');

  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test('ArenaBarChart draws an empty label for a bar with no label, rather than throwing or printing undefined', () => {
  const html = renderToStaticMarkup(<ArenaBarChart seriesLabel="Deployments per week" labels={['Only']} values={[10, 20]} />);
  assert.doesNotMatch(html, /undefined/, 'a bar with no label rendered the string "undefined"');
  assert.match(html, />Only</, 'the one supplied label still renders');
  assert.match(html, /<td>20<\/td>/, 'the unlabelled bar is still plotted and still in the table');
});
