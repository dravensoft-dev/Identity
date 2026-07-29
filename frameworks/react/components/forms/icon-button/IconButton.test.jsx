import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { IconButton } from './IconButton.jsx';

test('IconButton draws the Phosphor class it is given and hides it from assistive technology', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" />);
  assert.match(html, /class="ph-bold ph-plus"/);
  assert.match(html, /aria-hidden="true"/);
});

/* `label` must be the single accessible name. With showLabel unset the title
 * carries it too; with showLabel set the title is dropped, because a visible
 * label plus a title announces twice. Both branches are asserted because a
 * component that always rendered the title would pass the first alone. */
test('IconButton names itself with label, and drops the title once the label is visible', () => {
  const hidden = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" />);
  assert.match(hidden, /aria-label="New"/);
  assert.match(hidden, /title="New"/);
  const shown = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="New" showLabel />);
  assert.match(shown, /aria-label="New"/);
  assert.doesNotMatch(shown, /title="New"/);
});

/* Defaults to type="button" so an icon button inside a form does not submit
 * it -- the footgun ButtonType exists to make explicit. */
test('IconButton defaults its native type to button and honours an override', () => {
  assert.match(renderToStaticMarkup(<IconButton icon="ph-x" label="L" />), /type="button"/);
  assert.match(renderToStaticMarkup(<IconButton icon="ph-x" label="L" type="submit" />), /type="submit"/);
});

test('IconButton throws when icon is absent, matching the contract required flag', () => {
  assert.throws(
    () => renderToStaticMarkup(<IconButton label="New" />),
    /IconButton: `icon` is required/,
  );
});

test('IconButton throws when label is absent, matching the contract required flag', () => {
  assert.throws(
    () => renderToStaticMarkup(<IconButton icon="ph-x" />),
    /IconButton: `label` is required/,
  );
});

/* R4: the extends React.ButtonHTMLAttributes heritage clause and the {...rest}
 * spread both left this component, and `style` went with the heritage.
 * check:api reads the .d.ts and never opens the .jsx, so a test is the ONLY
 * regression guard. Asserted separately -- see Spinner. */
test('IconButton drops a consumer style object and a consumer attribute, each independently', () => {
  const html = renderToStaticMarkup(
    <IconButton icon="ph-x" label="L" style={{ color: '#ff00ff' }} data-stray="x" />
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- the {...rest} escape is back');
});

/* `tabStop` is the second global attribute Arena admits as a member, after
 * `id`, and it passes the same test api/README.md states for that one: the D1
 * flatten removed the capability, and there is no other surface a host can
 * write it on. An <arena-icon-button> host attribute would land on the custom
 * element, not on the <button> inside it.
 *
 * check:api reads the .d.ts and never opens the .jsx, so these three tests are
 * the ONLY guard that the attribute is really written. */
test('tabStop defaults to true and emits no tabindex at all', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" />);
  assert.doesNotMatch(html, /tabindex/i, 'a default IconButton wrote a tabindex it does not need');
});

test('tabStop={false} takes the control out of the page Tab sequence', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" tabStop={false} />);
  assert.match(html, /tabindex="-1"/, 'tabStop={false} did not write tabindex="-1"');
});

test('tabStop is not forwarded to the DOM as an unknown attribute', () => {
  const html = renderToStaticMarkup(<IconButton icon="ph-bold ph-plus" label="Add" tabStop={false} />);
  assert.doesNotMatch(html, /tabstop/i, 'the tabStop prop leaked into the markup');
});
