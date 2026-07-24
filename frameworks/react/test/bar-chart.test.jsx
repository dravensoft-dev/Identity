import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { BarChart } from '../components/charts/BarChart.jsx';

const LABELS = ['Mon', 'Tue', 'Wed'];
const VALUES = [12, 30, 7];

test('BarChart appends valueSuffix to the axis ticks and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <BarChart labels={LABELS} values={VALUES} seriesLabel="Deploys" valueSuffix=" ms" />
  );
  /* The value axis: niceMax(30) rounds UP to 50 (its `norm` of 3 falls in the
   * `<= 5` bucket, so the axis top is 5 x 10), and ticks() then yields
   * 0, 12.5, 25, 37.5, 50. The two asserted here are 12.5 and 37.5, chosen
   * because NEITHER is a member of VALUES -- a tick assertion naming 30 would
   * also be satisfied by the table's own `<td>30 ms</td>`, so it would pass
   * against a component that suffixed the table and left the axis bare. */
  assert.match(html, />12\.5 ms</, 'the axis tick carries the suffix');
  assert.match(html, />37\.5 ms</, 'the axis tick carries the suffix');
  // The hidden table: one <td> per value, each suffixed.
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v} ms</td>`), `the ${v} row carries the suffix`);
});

test('BarChart with no valueSuffix draws bare numbers, so the suffix is genuinely optional', () => {
  const html = renderToStaticMarkup(<BarChart labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('BarChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(
    () => renderToStaticMarkup(<BarChart values={VALUES} />),
    /BarChart: `labels` is required/,
  );
});

test('BarChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(
    () => renderToStaticMarkup(<BarChart labels={LABELS} />),
    /BarChart: `values` is required/,
  );
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard -- restoring either to the implementation leaves
 * the gate green. The two are asserted SEPARATELY on purpose: a component that
 * stopped spreading ...rest but still merged ...style would pass a single
 * combined assertion. */
test('BarChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <BarChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

/* The bar is the thing being labelled, so the category axis iterates `values`
 * and takes `labels[i]`, matching what `arena-bar-chart` already did
 * (`labels()[index] ?? ''`). Before this, React iterated `labels`, so a surplus
 * label was drawn at a column position no bar occupies -- text under blank
 * plot, spaced by a `step` computed from the OTHER array's length. The contract
 * states it plainly: "A label with no value at its index is dropped." */
test('BarChart drops a label with no value at its index, rather than drawing it over empty plot', () => {
  const html = renderToStaticMarkup(
    <BarChart labels={['Alpha', 'Beta', 'SURPLUS']} values={[10, 20]} />
  );
  assert.doesNotMatch(html, /SURPLUS/, 'a label with no value at its index reached the category axis');
  // The two real labels still render -- this must drop the surplus, not the axis.
  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test('BarChart draws an empty label for a bar with no label, rather than throwing or printing undefined', () => {
  const html = renderToStaticMarkup(<BarChart labels={['Only']} values={[10, 20]} />);
  assert.doesNotMatch(html, /undefined/, 'a bar with no label rendered the string "undefined"');
  assert.match(html, />Only</, 'the one supplied label still renders');
  assert.match(html, /<td>20<\/td>/, 'the unlabelled bar is still plotted and still in the table');
});
