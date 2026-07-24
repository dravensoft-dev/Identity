import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { DoughnutChart } from '../components/charts/DoughnutChart.jsx';

const LABELS = ['Web', 'API', 'Worker'];
const VALUES = [420, 310, 140];

test('DoughnutChart appends valueSuffix to the legend value and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );
  for (const v of VALUES) {
    assert.match(html, new RegExp(`<td>${v} rps</td>`), `the ${v} table row carries the suffix`);
    // The legend renders the same formatted value in its own <span>, so each
    // number appears twice. A suffix reaching only the table would fail here.
    assert.equal((html.match(new RegExp(`${v} rps`, 'g')) ?? []).length, 2, `${v} should appear in both the legend and the table`);
  }
});

/* The centre label is a PERCENTAGE, not a value, so it must never take the
 * suffix (api/README.md: the suffix is appended to every number the chart
 * DRAWS as a value). It only renders on hover, so static markup cannot show
 * it -- what this pins instead is that the suffix has not leaked into the
 * share arithmetic, which would surface as a stray suffix anywhere a percent
 * is computed. */
test('DoughnutChart does not append valueSuffix to anything that is not a plotted value', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} valueSuffix=" rps" />
  );
  // Six occurrences total: three legend values and three table cells. Any
  // seventh means the suffix reached something that is not a drawn value.
  assert.equal((html.match(/ rps/g) ?? []).length, 6);
});

test('DoughnutChart names itself from seriesLabel, and falls back to the type when none is given', () => {
  const named = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} seriesLabel="Traffic" />
  );
  assert.match(named, /aria-label="Traffic — doughnut chart"/);
  assert.match(named, /<caption>Traffic — doughnut chart<\/caption>/);
  assert.match(named, /<th>Traffic<\/th>/, 'the value column takes the series name');

  const unnamed = renderToStaticMarkup(<DoughnutChart labels={LABELS} values={VALUES} />);
  assert.match(unnamed, /aria-label="Doughnut chart"/);
  assert.match(unnamed, /<caption>Doughnut chart<\/caption>/);
  assert.match(unnamed, /<th>Value<\/th>/, 'with no series name the column falls back to "Value"');
});

test('DoughnutChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart values={VALUES} />), /DoughnutChart: `labels` is required/);
});

test('DoughnutChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<DoughnutChart labels={LABELS} />), /DoughnutChart: `values` is required/);
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted SEPARATELY: a component that stopped
 * spreading ...rest but still merged ...style would pass a combined assertion. */
test('DoughnutChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
