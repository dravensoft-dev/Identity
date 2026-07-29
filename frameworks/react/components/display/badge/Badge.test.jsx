/* Badge's render proof, added when Badge came under the API capability
 * contract. Nothing here asserts a computed pixel: the suite renders with
 * renderToStaticMarkup and asserts that a value resolves to var(--token)
 * rather than to a number, which is what the rest of this directory does. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Badge } from './Badge.jsx';

test('Badge renders its content slot', () => {
  assert.match(renderToStaticMarkup(<Badge>DRAFT</Badge>), /DRAFT/);
});

/* Each tone maps to a distinct token PAIR, and the assertion names the
 * foreground token, which appears in no other tone -- an assertion on the
 * shared --r-pill or on the neutral default would pass against a component
 * that ignored `tone`. */
test('Badge renders the token pair its tone names, not the neutral default', () => {
  assert.match(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--danger\)/);
  assert.match(renderToStaticMarkup(<Badge tone="gold">X</Badge>), /var\(--gold\)/);
  assert.doesNotMatch(renderToStaticMarkup(<Badge tone="danger">X</Badge>), /var\(--bone-dim\)/);
});

/* The dot is a bare <span> with no text, so its presence is only observable
 * through border-radius: 50% -- which the badge's own root does NOT carry (it
 * uses --r-pill). That makes the assertion discriminate between the two. */
test('Badge draws the dot only when asked', () => {
  assert.doesNotMatch(renderToStaticMarkup(<Badge>X</Badge>), /50%/);
  assert.match(renderToStaticMarkup(<Badge dot>X</Badge>), /50%/);
});

/* R4: the `extends React.HTMLAttributes<HTMLSpanElement>` heritage clause and
 * the `{...rest}` spread both left this component, and `style` went with the
 * heritage. check:api reads the .d.ts and never opens the .jsx, so a test is
 * the ONLY regression guard. The two are asserted SEPARATELY on purpose: a
 * component that stopped spreading ...rest but still merged ...style would
 * pass a single combined assertion. `color` is deliberately the property
 * carried here -- it is not in check-dimension-literals' PROPS set, and that
 * gate walks test directories too. */
test('Badge drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(<Badge style={{ color: '#ff00ff' }} data-stray="x">X</Badge>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});
