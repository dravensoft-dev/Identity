import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { SideNav } from '../components/navigation/SideNav.jsx';
import { SideNavItem } from '../components/navigation/SideNavItem.jsx';
import { SideNavSection } from '../components/navigation/SideNavSection.jsx';

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
