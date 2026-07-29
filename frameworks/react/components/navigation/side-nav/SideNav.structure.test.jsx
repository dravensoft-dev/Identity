import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';
import { SideNavItem } from '../components/navigation/SideNavItem.jsx';
import { SideNavSection } from '../components/navigation/SideNavSection.jsx';
import { SideNavCollapsible, subtreeHasItem } from '../components/navigation/SideNavCollapsible.jsx';

const section = (extra = {}) => (
  <SideNav ariaLabel="Primary" active="prod" {...extra}>
    <SideNavItem id="home" label="Home" href="#home" />
    <SideNavSection label="Workspace">
      <SideNavItem id="prod" label="Production" href="#prod" />
    </SideNavSection>
  </SideNav>
);

test('a section is a labelled group, named by the heading a sighted user reads', () => {
  const html = renderToStaticMarkup(section());
  const group = html.match(/<div role="group" aria-labelledby="([^"]+)"/);
  assert.ok(group, 'no role="group" with an aria-labelledby');
  assert.match(html, new RegExp(`id="${group[1]}"[^>]*>Workspace<`),
    'aria-labelledby names no element, or names one that does not read the label');
});

test('a section indents its children by one step and leaves a root item alone', () => {
  const html = renderToStaticMarkup(section());
  // depth 0 emits the base padding with no arithmetic at all
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3\)/);
  // depth 1 at the default indentStep of 3
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 3\)/);
});

test('indentStep multiplies the token, and the caller can only supply a multiplier', () => {
  const html = renderToStaticMarkup(section({ indentStep: 5 }));
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 5\)/);
});

test('a section with no children throws -- a childless section is not a legal shape', () => {
  assert.throws(
    () => renderToStaticMarkup(<SideNav ariaLabel="Primary"><SideNavSection label="Empty" /></SideNav>),
    /SideNavSection: a section with no children is not a legal shape/,
  );
});

test('a section whose only child is a false conditional throws too -- count() counts false, toArray() does not', () => {
  assert.throws(
    () => renderToStaticMarkup(
      <SideNav ariaLabel="Primary"><SideNavSection label="Admin">{false && <SideNavItem id="a" label="A" />}</SideNavSection></SideNav>),
    /SideNavSection: a section with no children is not a legal shape/,
  );
});

test('SideNavSection: `label` is required and a blank one throws too', () => {
  const one = <SideNavItem id="a" label="A" />;
  assert.throws(() => renderToStaticMarkup(<SideNavSection>{one}</SideNavSection>),
    /SideNavSection: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavSection label="">{one}</SideNavSection>),
    /SideNavSection: `label` is required/);
});

test('SideNavSection drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <SideNavSection label="W" style={{ color: '#ff00ff' }}><SideNavItem id="a" label="A" /></SideNavSection>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavSection drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNavSection label="W" data-stray="x"><SideNavItem id="a" label="A" /></SideNavSection>);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});

const nested = (props = {}) => (
  <SideNav ariaLabel="Primary" {...props}>
    <SideNavSection label="Workspace">
      <SideNavCollapsible id="deploys" label="Deployments" icon="ph-bold ph-rocket-launch">
        <SideNavItem id="prod" label="Production" href="#prod" />
      </SideNavCollapsible>
    </SideNavSection>
  </SideNav>
);

test('the trigger is a native button wired to the region it controls', () => {
  const html = renderToStaticMarkup(nested());
  assert.match(html, /<button [^>]*type="button"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="deploys-region"/);
  assert.match(html, /id="deploys-region"/);
  assert.match(html, /id="deploys-trigger"/);
});

/* The region exists while collapsed -- see decision (a). And `hidden` alone is
   not enough, because an inline display:flex would beat it -- decision (b). */
test('a collapsed region is rendered, hidden, and not merely hidden', () => {
  const html = renderToStaticMarkup(nested());
  assert.match(html, /id="deploys-region"[^>]*hidden/);
  assert.match(html, /id="deploys-region"[^>]*display:\s*none/);
});

test('defaultExpanded opens it on the first pass', () => {
  const html = renderToStaticMarkup(
    <SideNav ariaLabel="Primary">
      <SideNavCollapsible id="d" label="D" defaultExpanded>
        <SideNavItem id="p" label="P" href="#p" />
      </SideNavCollapsible>
    </SideNav>);
  assert.match(html, /aria-expanded="true"/);
  assert.doesNotMatch(html, /id="d-region"[^>]*hidden/);
});

/* Decision (d), the half a DOM suite cannot reach: an active id inside the
   subtree must open the group in the SERVER pass, or the active destination is
   missing from the markup a crawler and a no-JS reader see. */
test('a subtree holding the active id renders expanded with no effect having run', () => {
  const html = renderToStaticMarkup(nested({ active: 'prod' }));
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /aria-current="page"/);
});

test('nesting compounds the indent: an item inside a section inside a collapsible sits at depth 2', () => {
  const html = renderToStaticMarkup(nested({ active: 'prod' }));
  assert.match(html, /padding-inline-start:\s*calc\(var\(--sp-1\) \* 3 \+ var\(--sp-1\) \* 6\)/);
});

test('SideNavCollapsible: `id` and `label` are required, blank included', () => {
  const kid = <SideNavItem id="a" label="A" />;
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible label="D">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="" label="D">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `id` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="d">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `label` is required/);
  assert.throws(() => renderToStaticMarkup(<SideNavCollapsible id="d" label="">{kid}</SideNavCollapsible>),
    /SideNavCollapsible: `label` is required/);
});

/* THE TYPE CHECK IN subtreeHasItem, pinned. It matches `child.type ===
   SideNavItem && child.props.id === id`, and the first clause is the one with
   nothing else holding it: a collapsible carries an `id` of its own, and a
   consumer who names a GROUP after a destination has not said the group IS that
   destination.

   The discriminating fixture has to be a NESTED collapsible, not a top-level one.
   subtreeHasItem is called with a collapsible's CHILDREN, so a collapsible's own
   id is never among the props it inspects -- only a collapsible sitting inside
   another one puts a non-item `props.id` in front of the comparison. Here `outer`
   is asked whether it holds "inner", and `inner` is a child of it carrying
   exactly that id: with the type check the answer is no, without it the answer is
   yes and `outer` opens itself around a group rather than a destination.

   Both directions are asserted, and both without a render as well as through one
   -- which is also what makes the "exported so its own test can exercise it
   without a render" comment on subtreeHasItem true. */
const item = <SideNavItem id="prod" label="Production" href="#prod" />;

test('subtreeHasItem matches a SideNavItem by TYPE, so a group named after a destination is not one', () => {
  // The positive direction: a real destination at any depth is found.
  assert.equal(subtreeHasItem(item, 'prod'), true);
  assert.equal(subtreeHasItem(
    <SideNavCollapsible id="inner" label="Inner">{item}</SideNavCollapsible>, 'prod'), true,
    'a destination nested inside a collapsible was not found');

  // The negative direction, which is the clause under test: a COLLAPSIBLE whose
  // own id equals the active id is not a destination and must not match.
  assert.equal(subtreeHasItem(
    <SideNavCollapsible id="inner" label="Inner">{item}</SideNavCollapsible>, 'inner'), false,
    'a collapsible carrying the active id counted as holding it -- the type check is gone');
  // The same for a section, the other non-item wrapper that can carry props.
  assert.equal(subtreeHasItem(
    <SideNavSection label="Workspace">{item}</SideNavSection>, 'prod'), true);
});

test('a group whose own id is the active one does not open itself around it', () => {
  const html = renderToStaticMarkup(
    <SideNav ariaLabel="Primary" active="inner">
      <SideNavCollapsible id="outer" label="Outer">
        <SideNavCollapsible id="inner" label="Inner">{item}</SideNavCollapsible>
      </SideNavCollapsible>
    </SideNav>);
  /* Neither opens: `outer` does not hold a destination called "inner" -- it holds
     a GROUP called that -- and `inner` holds only "prod". An `active` naming a
     group is a consumer mistake, and the honest response is to open nothing
     rather than to guess. */
  assert.doesNotMatch(html, /aria-expanded="true"/,
    'a collapsible opened around a group rather than a destination');
  assert.match(html, /id="outer-region"[^>]*hidden/);
  assert.match(html, /id="inner-region"[^>]*hidden/);
});

test('SideNavCollapsible drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <SideNavCollapsible id="d" label="D" style={{ color: '#ff00ff' }}>
      <SideNavItem id="a" label="A" /></SideNavCollapsible>);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('SideNavCollapsible drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <SideNavCollapsible id="d" label="D" data-stray="x">
      <SideNavItem id="a" label="A" /></SideNavCollapsible>);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
