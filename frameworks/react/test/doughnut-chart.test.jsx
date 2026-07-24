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

/* The slice is the thing being named, so the legend iterates `values` and takes
 * `labels[i]`, matching what `arena-doughnut-chart` already did
 * (`labels()[index] ?? ''`). Before this, React iterated `labels`, and a
 * surplus label was the worst case of the three charts: `colors` has length
 * `values.length`, so `colors[i]` came back undefined and the row rendered a
 * COLOURLESS swatch beside the literal string "undefined". The contract states
 * it plainly: "A label with no value at its index is dropped." */
test('DoughnutChart drops a label with no value at its index, rather than drawing a colourless swatch beside "undefined"', () => {
  const html = renderToStaticMarkup(
    <DoughnutChart labels={['Alpha', 'Beta', 'SURPLUS']} values={[10, 20]} valueSuffix=" rps" />
  );
  assert.doesNotMatch(html, /SURPLUS/, 'a label with no value at its index reached the legend');
  assert.doesNotMatch(html, /undefined/, 'the surplus legend row printed "undefined" as its value');
  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test('DoughnutChart draws an empty label for a slice with no label, rather than throwing or printing undefined', () => {
  const html = renderToStaticMarkup(<DoughnutChart labels={['Only']} values={[10, 20]} />);
  assert.doesNotMatch(html, /undefined/, 'a slice with no label rendered the string "undefined"');
  assert.match(html, />Only</, 'the one supplied label still renders');
  assert.match(html, /<td>20<\/td>/, 'the unlabelled slice is still plotted and still in the table');
});
