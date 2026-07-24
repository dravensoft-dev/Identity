import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { LineChart } from '../components/charts/LineChart.jsx';

const LABELS = ['Mon', 'Tue', 'Wed'];
const VALUES = [120, 138, 131];

test('LineChart appends valueSuffix to the axis ticks and to the accessible table', () => {
  const html = renderToStaticMarkup(
    <LineChart labels={LABELS} values={VALUES} seriesLabel="p95" valueSuffix=" ms" />
  );
  /* niceMax(138) rounds to 200, so ticks() yields 0, 50, 100, 150, 200 -- none
   * of which is a member of VALUES. That is deliberate: a tick assertion naming
   * a number the table also renders would pass against a component that
   * suffixed the table and left the axis bare. Verify the tick values by
   * running the test before trusting them; niceMax's rounding is not obvious. */
  assert.match(html, />50 ms</, 'the axis tick carries the suffix');
  assert.match(html, />200 ms</, 'the top axis tick carries the suffix');
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v} ms</td>`), `the ${v} row carries the suffix`);
});

test('LineChart with no valueSuffix draws bare numbers', () => {
  const html = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} />);
  for (const v of VALUES) assert.match(html, new RegExp(`<td>${v}</td>`));
  assert.doesNotMatch(html, /undefined/, 'an absent suffix must not render the string "undefined"');
});

test('LineChart throws when labels is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<LineChart values={VALUES} />), /LineChart: `labels` is required/);
});

test('LineChart throws when values is absent, matching Angular input.required', () => {
  assert.throws(() => renderToStaticMarkup(<LineChart labels={LABELS} />), /LineChart: `values` is required/);
});

/* `area` survived the migration as a real contracted member, and it is the one
 * member of the three charts whose two layers bind it differently in syntax
 * (React a boolean prop, Angular input(false, {transform: booleanAttribute})).
 * This asserts the React half actually draws the fill, so a flattening that
 * dropped the member would fail here rather than only in the type declaration. */
test('LineChart draws the area fill only when area is set', () => {
  const withArea = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} area />);
  const without = renderToStaticMarkup(<LineChart labels={LABELS} values={VALUES} />);
  assert.match(withArea, /color-mix\(in oklab/, 'the 18% tint did not render');
  assert.doesNotMatch(without, /color-mix\(in oklab/, 'the tint rendered without area being set');
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. Asserted SEPARATELY: a component that stopped
 * spreading ...rest but still merged ...style would pass a combined assertion. */
test('LineChart drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <LineChart labels={LABELS} values={VALUES} style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

/* The point is the thing being labelled, so the point axis iterates `values`
 * and takes `labels[i]`, matching what `arena-line-chart` already did
 * (`labels()[index] ?? ''`). Before this, React iterated `labels`, so a surplus
 * label was drawn at an `xOf(i)` whose spacing came from the OTHER array's
 * length. The contract states it plainly: "A label with no value at its index
 * is dropped." */
test('LineChart drops a label with no value at its index, rather than drawing it over empty plot', () => {
  const html = renderToStaticMarkup(
    <LineChart labels={['Alpha', 'Beta', 'SURPLUS']} values={[10, 20]} />
  );
  assert.doesNotMatch(html, /SURPLUS/, 'a label with no value at its index reached the point axis');
  assert.match(html, />Alpha</);
  assert.match(html, />Beta</);
});

test('LineChart draws an empty label for a point with no label, rather than throwing or printing undefined', () => {
  const html = renderToStaticMarkup(<LineChart labels={['Only']} values={[10, 20]} />);
  assert.doesNotMatch(html, /undefined/, 'a point with no label rendered the string "undefined"');
  assert.match(html, />Only</, 'the one supplied label still renders');
  assert.match(html, /<td>20<\/td>/, 'the unlabelled point is still plotted and still in the table');
});
