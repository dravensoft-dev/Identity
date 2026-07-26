import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';
import { SideNavItem } from '../components/navigation/SideNavItem.jsx';
import { indentFor } from '../components/navigation/side-nav-inject.jsx';

/* One SSR suite is enough for this pair, and that is a fact about them rather
 * than a shortcut. Menu needed two files -- an SSR one and a DOM one -- because
 * its panel does not exist until its trigger is clicked, so half its markup, and
 * with it half the surface an R4 escape could be merged into, is unreachable
 * from renderToStaticMarkup. SideNav has no such half: the <nav> root renders
 * unconditionally on the first pass with every item inside it, and that root is
 * the only element `style` and the {...rest} spread were ever applied to. So
 * every assertion below, the four R4 ones included, is decidable from static
 * markup -- and the two that need a handler reach it the one other way a
 * function component allows: call the component and read the onClick off the
 * element it returned. Under the compound shape that is TWO calls rather than
 * one, because the <nav>'s children are cloned SideNavItem ELEMENTS and the
 * onClick lives on the <a>/<button> each of them renders. */

/* An ARRAY, deliberately, and not a fragment. `React.Children.toArray` flattens
   nested arrays and does NOT flatten a fragment -- it returns the fragment as one
   child -- so a fixture written as <>…</> would hand injectInto a single element
   that is not an item, and every assertion below would fail for a reason that has
   nothing to do with the component. See injectInto's own comment: this is a real
   limit of the idiom, not a quirk of the test. */
const TREE = [
  <SideNavItem key="dashboard" id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />,
  <SideNavItem key="settings" id="settings" label="Settings" />,
];

test('an item with href is an anchor, one without is a button', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" active="dashboard">{TREE}</SideNav>);
  assert.match(html, /<a [^>]*href="\/projects"/);
  assert.match(html, /<button /);
});

test('the active item carries aria-current="page" and nothing else does', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" active="dashboard">{TREE}</SideNav>);
  assert.equal(html.match(/aria-current="page"/g).length, 1);
});

test('the nav is labelled', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /<nav [^>]*aria-label="Primary"/);
});

test('active and inactive items differ in weight and colour', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" active="dashboard">{TREE}</SideNav>);
  assert.match(html, /var\(--crimson-soft\)/);
  assert.match(html, /var\(--fw-semibold\)/);
  assert.match(html, /var\(--fw-medium\)/);
});

/* `nav` used to carry the whole SideNavItem. Under the compound shape there is
   no item datum to carry -- the consumer wrote the element and already holds
   everything on it -- so it carries the activated item's `id`, a string. The
   Breadcrumbs resolution that put the item alone in the payload is unchanged and
   simply has nothing left to apply to. */
test('onNav carries the activated id alone, and no DOM event reaches the handler', () => {
  const seen = [];
  const tree = SideNav({ children: TREE, ariaLabel: 'Primary', onNav: (...args) => seen.push(args) });
  // The <nav>'s children are the cloned items; each item element must be invoked
  // to read the onClick its own render puts on the <a>/<button>.
  const [anchor, button] = tree.props.children.map((el) => SideNavItem(el.props));
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };

  anchor.props.onClick(event);
  assert.equal(seen[0].length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal(seen[0][0], 'dashboard', 'the payload is not the activated id');

  button.props.onClick(event);
  assert.equal(seen[1].length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal(seen[1][0], 'settings');
});

test('the anchor keeps its native navigation: nothing in the click path suppresses it', () => {
  const tree = SideNav({ children: TREE, ariaLabel: 'Primary', onNav: () => {} });
  const anchor = SideNavItem(tree.props.children[0].props);
  assert.equal(anchor.props.href, '/projects', 'the anchor lost its href and stopped being a link');
  const event = { preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false };
  anchor.props.onClick(event);
  assert.equal(event.defaultPrevented, false,
    'something called preventDefault -- ctrl-click and open-in-new-tab are what that costs');
});

/* The single-icon convention: Arena draws the <i>, the consumer names the glyph.
 * `icon` was a React node before this contract and is a Phosphor class name now. */
test('an icon is a class name Arena draws, never markup the caller passes', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /<i class="ph-bold ph-squares-four"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, />ph-bold ph-squares-four</, 'the class name was drawn as text');
});

/* R4: `style` and the `extends React.HTMLAttributes<HTMLElement>` heritage clause
 * both left the component. Asserted in two separate tests -- node:assert aborts on
 * the first failure, so one body asserting both cannot discriminate which escape
 * came back. */
test('SideNav drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <SideNav ariaLabel="Primary" style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNav drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNav ariaLabel="Primary" data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* `ariaLabel` is declared required in the contract, and api/README.md's
 * required-ness rule says the implementation fails hard rather than rendering
 * with a missing value. It previously defaulted to the constant "Primary", which
 * is the defect rather than a convenience: it names every unlabelled nav on a
 * page the same thing, and the navigation pattern asks each landmark for a
 * unique name. */
test('ariaLabel is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav>{TREE}</SideNav>),
    /SideNav: `ariaLabel` is required/,
  );
});

/* An EMPTY STRING is the case that matters, and it is not the same case as
 * absence. `ariaLabel=""` renders `<nav aria-label="">`, a landmark with no
 * accessible name -- precisely the defect the guard exists to prevent, arriving
 * through a value that is present. The guard read `== null` until plan 8C4's
 * close-out review, which let this through; every sibling accessible-name guard
 * in the layer (Table's `label`, Tooltip's, CalendarEvent's, and 8C4's own
 * Dialog and ConfirmDialog `title`) uses a falsy check for exactly this reason. */
test('an empty ariaLabel throws too -- a present-but-blank name is the defect, not just an absent one', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav ariaLabel="">{TREE}</SideNav>),
    /SideNav: `ariaLabel` is required/,
  );
});

/* `items` is gone, so its absence-only guard is gone with it. What replaces it is
   NOT a guard: a SideNav with no children renders an empty landmark, which was
   always the legal reading of an empty array. The test that asserted `items` is
   required is deleted, and this one keeps the behaviour it protected. */
test('a SideNav with no children renders an empty landmark rather than throwing', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" />);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.doesNotMatch(html, /<a|<button/);
});

test('the item text re-densifies with the control scale', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /var\(--dz-text\)/);
});

/* indentFor() PRODUCES a governed dimension, and check:dimensions cannot judge
 * it. The gate keys on governed property SITES -- `prop: value`, an attribute,
 * a traced local -- and a value returned from a function is at no such site; the
 * call site `paddingInlineStart: indentFor(indentStep, depth)` is a call
 * expression, which the gate's own dataflow rule explicitly cannot trace back to
 * a declaration. Renaming this module to .jsx put the FILE under the gate (a
 * bare literal written at a governed property inside it now fails, which was not
 * true while it was .js), but the return value stays outside what any gate can
 * see. So it is asserted here instead: this is the only thing standing between
 * `indentFor` and a bare '12px'. Both branches, because depth 0 takes the early
 * one and every nested level takes the other. */
test('indentFor returns token arithmetic at every depth, never a bare length', () => {
  assert.equal(indentFor(3, 0), 'calc(var(--sp-1) * 3)');
  assert.equal(indentFor(3, 1), 'calc(var(--sp-1) * 3 + var(--sp-1) * 3)');
  assert.equal(indentFor(3, 2), 'calc(var(--sp-1) * 3 + var(--sp-1) * 6)');
  /* The real assertion is the one that survives a rewrite of the arithmetic:
     whatever indentFor returns, every length in it comes from a token, so the
     indent re-densifies inside .arena-compact along with everything else. */
  for (const depth of [0, 1, 2, 5]) {
    const out = indentFor(3, depth);
    assert.match(out, /var\(--sp-1\)/, 'the indent stopped reading a token');
    assert.doesNotMatch(out, /\d+(px|rem|em)\b/, `indentFor(3, ${depth}) emitted a bare length: ${out}`);
  }
});

test('SideNavItem: `id` is required and a blank one throws too', () => {
  assert.throws(() => renderToStaticMarkup(<SideNavItem label="Home" />), /SideNavItem: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="" label="Home" />), /SideNavItem: `id` is required/);
});

test('SideNavItem: `label` is required and a blank one throws too', () => {
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" />), /SideNavItem: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" label="" />), /SideNavItem: `label` is required/);
});

/* R4, per component and asserted in two separate bodies -- node:assert aborts on
   the first failure, so one body asserting both escapes cannot say which came back. */
test('SideNavItem drops a consumer style object', () => {
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavItem drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
