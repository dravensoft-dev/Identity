import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Menu } from '../components/navigation/Menu.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, and a Menu's
 * panel only exists after its trigger has been clicked -- `open` is internal
 * state that starts false. So the half of Menu's contract that lives inside the
 * panel (an entry's `icon` drawn as an <i>, `select` carrying the whole item, a
 * disabled entry reporting nothing) is NOT verifiable here and is asserted
 * against a real tree in frameworks/react/test-dom/menu.test.jsx.
 *
 * What IS verifiable here is everything the closed component renders: the
 * trigger slot reaching the page, neither R4 escape being left on the root, and
 * the required `items` guard. The R4 assertions belong in this directory rather
 * than beside the others precisely because they are about the ROOT element,
 * which is drawn whether the menu is open or not. */

test('a closed Menu draws its trigger and no panel', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[{ label: 'Rename' }]} />,
  );
  assert.match(html, /<button type="button">Open<\/button>/);
  assert.doesNotMatch(html, /role="menu"/, 'the panel rendered before anything opened it');
  /* Counted, not merely absent: an entry drawn outside the panel would be a row
   * on the page with nothing to close it. */
  assert.equal((html.match(/Rename/g) || []).length, 0, 'an entry was drawn while the menu was closed');
});

/* R4: `style` left the component, and there is no {...rest} to put back. Asserted
 * in two separate tests -- node:assert aborts on the first failure, so one body
 * asserting both cannot discriminate which escape came back. */
test('Menu drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[]} style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Menu drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Menu trigger={<button type="button">Open</button>} items={[]} data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* `items` is declared required in the contract, and api/README.md's required-ness
 * rule says the implementation fails hard rather than rendering with a missing
 * value. Before this it defaulted to `[]` and a Menu with no entries opened onto
 * an empty panel. It guards absence only, the shape Tabs already uses for the
 * same member. */
test('items is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Menu trigger={<button type="button">Open</button>} />),
    /Menu: `items` is required/,
  );
});

test('an empty items array renders rather than throwing', () => {
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Menu trigger={<button type="button">Open</button>} items={[]} />),
  );
});
