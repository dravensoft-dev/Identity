import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';

/* One SSR suite is enough for this component, and that is a fact about it rather
 * than a shortcut. Menu needed two files -- an SSR one and a DOM one -- because
 * its panel does not exist until its trigger is clicked, so half its markup, and
 * with it half the surface an R4 escape could be merged into, is unreachable
 * from renderToStaticMarkup. SideNav has no such half: the <nav> root renders
 * unconditionally on the first pass with every item inside it, and that root is
 * the only element `style` and the {...rest} spread were ever applied to. So
 * every assertion below, the two R4 ones included, is decidable from static
 * markup -- and the two that need a handler reach it the one other way a
 * function component allows: call the component and read the onClick off the
 * element it returned. */

const ITEMS = [
  { id: 'dashboard', icon: 'ph-bold ph-squares-four', label: 'Projects', href: '/projects' },
  { id: 'settings', label: 'Settings' },
];

test('an item with href is an anchor, one without is a button', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" active="dashboard" />);
  assert.match(html, /<a [^>]*href="\/projects"/);
  assert.match(html, /<button /);
});

test('the active item carries aria-current="page" and nothing else does', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" active="dashboard" />);
  assert.equal(html.match(/aria-current="page"/g).length, 1);
});

test('the nav is labelled', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" />);
  assert.match(html, /<nav [^>]*aria-label="Primary"/);
});

test('active and inactive items differ in weight and colour', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" active="dashboard" />);
  assert.match(html, /var\(--crimson-soft\)/);
  assert.match(html, /var\(--fw-semibold\)/);
  assert.match(html, /var\(--fw-medium\)/);
});

/* These two used to pin the OPPOSITE claim -- that `onNav` received the click
 * event as a second argument so a single-page app could preventDefault() and
 * route in place. A platform event is an R4 violation inside a payload, and an
 * event carries exactly one, so the item alone travels now (the Breadcrumbs
 * resolution). They are inverted rather than deleted: what they pinned is
 * exactly what this task reverses, so they are the proof it happened. */
test('onNav carries the whole item, and no DOM event reaches the handler', () => {
  const seen = [];
  const tree = SideNav({ items: ITEMS, ariaLabel: 'Primary', onNav: (...args) => seen.push(args) });
  const [anchor, button] = tree.props.children;
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };

  anchor.props.onClick(event);
  assert.equal(seen[0].length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal(seen[0][0], ITEMS[0], 'the payload is not the item itself');

  button.props.onClick(event);
  assert.equal(seen[1].length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal(seen[1][0], ITEMS[1], 'the payload is not the item itself');
});

test('the anchor keeps its native navigation: nothing in the click path suppresses it', () => {
  const tree = SideNav({ items: ITEMS, ariaLabel: 'Primary', onNav: () => {} });
  const [anchor] = tree.props.children;
  assert.equal(anchor.props.href, '/projects', 'the anchor lost its href and stopped being a link');

  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };
  anchor.props.onClick(event);
  assert.equal(event.defaultPrevented, false,
    'something called preventDefault -- ctrl-click and open-in-new-tab are what that costs');

  /* And an item wired to nothing still clicks: `onNav` is optional, and the
   * anchor navigating on its own is the whole point of leaving it that way. */
  const bare = SideNav({ items: ITEMS, ariaLabel: 'Primary' });
  assert.doesNotThrow(() => bare.props.children[0].props.onClick({}));
});

/* The single-icon convention: Arena draws the <i>, the consumer names the glyph.
 * `icon` was a React node before this contract and is a Phosphor class name now. */
test('an icon is a class name Arena draws, never markup the caller passes', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" />);
  assert.match(html, /<i class="ph-bold ph-squares-four"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, />ph-bold ph-squares-four</, 'the class name was drawn as text');
});

/* R4: `style` and the `extends React.HTMLAttributes<HTMLElement>` heritage clause
 * both left the component. Asserted in two separate tests -- node:assert aborts on
 * the first failure, so one body asserting both cannot discriminate which escape
 * came back. */
test('SideNav drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <SideNav items={ITEMS} ariaLabel="Primary" style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNav drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNav items={ITEMS} ariaLabel="Primary" data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* Both are declared required in the contract, and api/README.md's required-ness
 * rule says the implementation fails hard rather than rendering with a missing
 * value. `ariaLabel` previously defaulted to the constant "Primary", which is the
 * defect rather than a convenience: it names every unlabelled nav on a page the
 * same thing, and the navigation pattern asks each landmark for a unique name. */
test('items is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav ariaLabel="Primary" />),
    /SideNav: `items` is required/,
  );
});

test('ariaLabel is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav items={ITEMS} />),
    /SideNav: `ariaLabel` is required/,
  );
});

/* An EMPTY STRING is the case that matters, and it is not the same case as
 * absence. `ariaLabel=""` renders `<nav aria-label="">`, a landmark with no
 * accessible name -- precisely the defect the guard exists to prevent, arriving
 * through a value that is present. The guard read `== null` until plan 8C4's
 * close-out review, which let this through; every sibling accessible-name guard
 * in the layer (Table's `label`, Tooltip's, CalendarEvent's, and this batch's own
 * Dialog and ConfirmDialog `title`) uses a falsy check for exactly this reason. */
test('an empty ariaLabel throws too -- a present-but-blank name is the defect, not just an absent one', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="" />),
    /SideNav: `ariaLabel` is required/,
  );
});

/* The counterpart, and the reason the two guards differ: an empty ARRAY is
 * legal. It is a caller saying "no destinations right now", which renders an
 * empty landmark rather than throwing. */
test('an empty items array renders an empty landmark rather than throwing', () => {
  const html = renderToStaticMarkup(<SideNav items={[]} ariaLabel="Primary" />);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.doesNotMatch(html, /<a|<button/);
});

test('the item text re-densifies with the control scale', () => {
  const html = renderToStaticMarkup(<SideNav items={ITEMS} ariaLabel="Primary" />);
  assert.match(html, /var\(--dz-text\)/);
});
