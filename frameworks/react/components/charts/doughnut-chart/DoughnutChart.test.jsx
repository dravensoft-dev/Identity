import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { DoughnutChart } from './DoughnutChart.jsx';

const LABELS = ['Web', 'API', 'Worker'];
const VALUES = [420, 310, 140];

test('DoughnutChart appends valueSuffix to the legend value and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart seriesLabel="Traffic by region" labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );
  for (const v of VALUES) {
    assert.match(html, new RegExp(`<td>${v} rps</td>`), `the ${v} table row carries the suffix`);

    assert.equal((html.match(new RegExp(`${v} rps`, 'g')) ?? []).length, 2, `${v} should appear in both the legend and the table`);
  }
});

test('DoughnutChart does not append valueSuffix to anything that is not a plotted value', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart seriesLabel="Traffic by region" labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );

  assert.equal((html.match(/ rps/g) ?? []).length, 6);
});

test('DoughnutChart with no valueSuffix draws bare numbers, so the suffix is genuinely optional', () => {
  const html = renderToStaticMarkup(<DoughnutChart seriesLabel="Traffic by region" labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('DoughnutChart names itself from seriesLabel, and an absent one throws rather than naming the type', () => {
  const named = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} seriesLabel="Traffic" />
  );
  assert.match(named, /aria-label="Traffic — doughnut chart"/);
  assert.match(named, /<caption>Traffic — doughnut chart<\/caption>/);
  assert.match(named, /<th>Traffic<\/th>/, 'the value column takes the series name');

  assert.throws(
    () => renderToStaticMarkup(<DoughnutChart labels={LABELS} values={VALUES} />),
    /`seriesLabel` is required/,
    'a name that is only the chart TYPE makes two charts on one page announce identically',
  );
});

test('DoughnutChart throws when labels is absent, which required-ness demands of every layer', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart seriesLabel="Traffic by region" values={VALUES} />), /DoughnutChart: `labels` is required/);
});

test('DoughnutChart throws when values is absent, which required-ness demands of every layer', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart seriesLabel="Traffic by region" labels={LABELS} />), /DoughnutChart: `values` is required/);
});

test('DoughnutChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart seriesLabel="Traffic by region" labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

test('DoughnutChart drops a label with no value at its index, rather than drawing a colourless swatch beside "undefined"', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart seriesLabel="Traffic by region" labels={['Alpha', 'Beta', 'SURPLUS']} values={[10, 20]} valueSuffix=" rps" />
  );
  assert.doesNotMatch(html, /SURPLUS/, 'a label with no value at its index reached the legend');
  assert.doesNotMatch(html, /undefined/, 'the surplus legend row printed "undefined" as its value');
  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test('DoughnutChart draws an empty label for a slice with no label, rather than throwing or printing undefined', () => {
  const html = renderToStaticMarkup(<DoughnutChart seriesLabel="Traffic by region" labels={['Only']} values={[10, 20]} />);
  assert.doesNotMatch(html, /undefined/, 'a slice with no label rendered the string "undefined"');
  assert.match(html, />Only</, 'the one supplied label still renders');
  assert.match(html, /<td>20<\/td>/, 'the unlabelled slice is still plotted and still in the table');
});
