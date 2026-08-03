import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from './SideNav.tsx';
import { SideNavItem } from '../side-nav-item/SideNavItem.tsx';
import { indentFor } from './SideNavInject.tsx';

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
  assert.equal(html.match(/aria-current="page"/g)!.length, 1);
});

test('the nav is labelled', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /<nav [^>]*aria-label="Primary"/);
});

test('active and inactive items differ in weight and colour', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" active="dashboard">{TREE}</SideNav>);
  assert.match(html, /\bbg-primary\/14\b/);
  assert.match(html, /\btext-primary\b/);
  assert.match(html, /\bfont-semibold\b/);
  assert.match(html, /\bfont-medium\b/);
  assert.match(html, /\bbg-transparent\b/);
});

test('onNav carries the activated id alone, and no DOM event reaches the handler', () => {
  const seen: unknown[] = [];
  const tree = SideNav({ children: TREE, ariaLabel: 'Primary', onNav: (...args) => seen.push(args) });

  const [anchor, button] = tree.props.children.map((el: React.ReactElement) => SideNavItem(el.props));
  const event = {
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false,
  };

  anchor.props.onClick(event);
  assert.equal((seen[0] as unknown[]).length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal((seen[0] as unknown[])[0], 'dashboard', 'the payload is not the activated id');

  button.props.onClick(event);
  assert.equal((seen[1] as unknown[]).length, 1, 'a second argument reached the handler -- the DOM event is back');
  assert.equal((seen[1] as unknown[])[0], 'settings');
});

test('an item in a nav that wired no onNav still clicks rather than throwing', () => {
  const bare = SideNav({ children: TREE, ariaLabel: 'Primary' });
  const [anchor, button] = bare.props.children.map((el: React.ReactElement) => SideNavItem(el.props));
  assert.doesNotThrow(() => anchor.props.onClick({}),
    'clicking an item in a nav with no onNav threw -- SideNavItem lost its `onActivate &&` guard');
  assert.doesNotThrow(() => button.props.onClick({}),
    'clicking an item in a nav with no onNav threw -- SideNavItem lost its `onActivate &&` guard');
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

test('an icon is a class name Arena draws, never markup the caller passes', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /<i class="ph-bold ph-squares-four [^"]*"[^>]*aria-hidden="true"/,
    "the Phosphor class the consumer named leads, and the manifest's icon slot sizes it");
  assert.doesNotMatch(html, />ph-bold ph-squares-four</, 'the class name was drawn as text');
});

test('SideNav drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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

test('ariaLabel is required and its absence throws', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<SideNav>{TREE}</SideNav>),
    /SideNav: `ariaLabel` is required/,
  );
});

test('an empty ariaLabel throws too -- a present-but-blank name is the defect, not just an absent one', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav ariaLabel="">{TREE}</SideNav>),
    /SideNav: `ariaLabel` is required/,
  );
});

test('a SideNav with no children renders an empty landmark rather than throwing', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary" />);
  assert.match(html, /<nav[^>]*aria-label="Primary"/);
  assert.doesNotMatch(html, /<a|<button/);
});

test('the item text re-densifies with the control scale', () => {
  const html = renderToStaticMarkup(<SideNav ariaLabel="Primary">{TREE}</SideNav>);
  assert.match(html, /\btext-ctl\b/,
    'the control text step is what .arena-compact re-densifies, and the row reads it as a utility');
});

test('indentFor returns token arithmetic at every depth, never a bare length', () => {
  assert.equal(indentFor(3, 0), 'calc(var(--sp-1) * 3)');
  assert.equal(indentFor(3, 1), 'calc(var(--sp-1) * 3 + var(--sp-1) * 3)');
  assert.equal(indentFor(3, 2), 'calc(var(--sp-1) * 3 + var(--sp-1) * 6)');

  for (const depth of [0, 1, 2, 5]) {
    const out = indentFor(3, depth);
    assert.match(out, /var\(--sp-1\)/, 'the indent stopped reading a token');
    assert.doesNotMatch(out, /\d+(px|rem|em)\b/, `indentFor(3, ${depth}) emitted a bare length: ${out}`);
  }
});

test('SideNavItem: `id` is required and a blank one throws too', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<SideNavItem label="Home" />), /SideNavItem: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="" label="Home" />), /SideNavItem: `id` is required/);
});

test('SideNavItem: `label` is required and a blank one throws too', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" />), /SideNavItem: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavItem id="home" label="" />), /SideNavItem: `label` is required/);
});

test('SideNavItem drops a consumer style object', () => {
  // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavItem drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<SideNavItem id="a" label="A" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
