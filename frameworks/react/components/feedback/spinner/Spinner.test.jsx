/* Spinner's render proof, added when Spinner came under the API capability
 * contract. Nothing here asserts a computed pixel: the suite renders with
 * renderToStaticMarkup and asserts that a value resolves to var(--token)
 * rather than to a number, which is what the rest of this directory does. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Spinner } from './Spinner.jsx';

test('Spinner announces its label through the status role', () => {
  const html = renderToStaticMarkup(<Spinner label="Loading deploys" />);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-label="Loading deploys"/);
});

test('Spinner falls back to "Loading" when no label is given', () => {
  assert.match(renderToStaticMarkup(<Spinner />), /aria-label="Loading"/);
});

/* The size map is read through member access, so the rendered diameter is the
 * only place the chosen entry is observable. --icon-sm belongs to `sm` alone
 * and --sp-8 to `lg` alone, so each assertion names a token the other two
 * sizes never emit -- an assertion on --sp-5 would also be satisfied by the
 * default, and would pass against a component that ignored `size` entirely. */
test('Spinner renders the diameter token its size names, not the default', () => {
  assert.match(renderToStaticMarkup(<Spinner size="sm" />), /var\(--icon-sm\)/);
  assert.match(renderToStaticMarkup(<Spinner size="lg" />), /var\(--sp-8\)/);
});

/* Same discrimination on the tone map. --on-accent and --gold each belong to
 * one tone alone; --crimson would also be emitted by the `accent` default. */
test('Spinner renders the colour token its tone names', () => {
  assert.match(renderToStaticMarkup(<Spinner tone="on-accent" />), /var\(--on-accent\)/);
  assert.match(renderToStaticMarkup(<Spinner tone="gold" />), /var\(--gold\)/);
});

/* R4: `style?: React.CSSProperties` and the `{...rest}` spread both left this
 * component. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. The two are asserted SEPARATELY on purpose: a
 * component that stopped spreading ...rest but still merged ...style would
 * pass a single combined assertion. `color` is deliberately the property
 * carried here -- it is not in check-dimension-literals' PROPS set, and that
 * gate walks test directories too. */
test('Spinner drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <Spinner style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
