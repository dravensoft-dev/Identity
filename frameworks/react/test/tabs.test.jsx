import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tabs } from '../components/navigation/Tabs.jsx';
import { Tab } from '../components/navigation/Tab.jsx';

/* This directory has no DOM, so no test here fires a click or an arrow key -- the
 * roving tab stop MOVING, and `change`'s payload, are asserted in
 * frameworks/react/test-dom/tabs.test.jsx. What SSR can hold is the structure:
 * that a tablist and exactly one tabpanel are rendered, that the wiring between
 * them resolves, that the degenerate empty case stays valid, and the R4 escapes.
 *
 * Every fixture's value and label DIFFER on purpose: a same-string fixture cannot
 * discriminate a component that keys the selection off the label.
 *
 * React's SSR does not emit attributes in source order, so nothing below assumes
 * adjacency; the wiring tests read the two ids out and compare them instead. */

const three = (props = {}) => (
  <Tabs {...props}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
  </Tabs>
);

test('a tablist and exactly one tabpanel are rendered', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1,
    'a widget must render exactly one tabpanel -- the selected tab\'s');
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
});

test('the panel shows the selected tab\'s children and no other tab\'s', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'dp' }));
  assert.match(html, /deployments body/);
  assert.doesNotMatch(html, /overview body/,
    'an unselected tab\'s content was rendered -- the panel shows one tab at a time');
});

/* roles.controls and the panel's own labelling, asserted by RESOLVING the ids
 * rather than by matching a literal: useId()'s value is not ours to predict, and
 * a test that hard-coded one would pin React's internals instead of our wiring. */
test('the selected tab and its panel reference each other', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  const panelId = /role="tabpanel"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*role="tabpanel"/.exec(html);
  const controls = /aria-selected="true"[^>]*aria-controls="([^"]+)"|aria-controls="([^"]+)"[^>]*aria-selected="true"/.exec(html);
  const panel = panelId[1] ?? panelId[2];
  const controlled = controls[1] ?? controls[2];
  assert.equal(controlled, panel, 'the selected tab\'s aria-controls does not resolve to the panel');
  assert.match(html, new RegExp(`aria-labelledby="[^"]+"`));
});

test('an id Arena renders is usable in a CSS selector', () => {
  /* useId() returns a value containing colons (`:r0:`), which is legal in an id
     attribute and a SyntaxError inside a selector. The ids are stripped of them
     so the suites -- and a consumer -- can address what Arena rendered. */
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) assert.doesNotMatch(id, /:/, `id "${id}" contains a colon and cannot be selected`);
});

test('value governs the selection when passed, over defaultValue', () => {
  const html = renderToStaticMarkup(three({ value: 'dp', defaultValue: 'ov' }));
  assert.match(html, /deployments body/);
});

test('with neither value nor defaultValue the first tab is selected', () => {
  const html = renderToStaticMarkup(three());
  assert.match(html, /overview body/);
});

/* The degenerate case. An empty collection is a caller saying "no tabs right now"
 * -- the stance this component already held and this suite already pinned -- so it
 * renders rather than throwing. What it must NOT do is render a tabpanel whose
 * aria-labelledby points at a tab that does not exist: a dangling label is worse
 * than an absent one, and an accessibility batch may not ship it. */
test('no children renders an empty tablist and no tabpanel at all', () => {
  const html = renderToStaticMarkup(<Tabs />);
  assert.match(html, /role="tablist"/);
  assert.doesNotMatch(html, /role="tabpanel"/, 'a tabpanel was rendered with no tab to label it');
  assert.doesNotMatch(html, /aria-labelledby/);
});

test('a conditionally-rendered tab that is false is absent, not counted', () => {
  /* toArray() drops a bare `false` where count() would count it as one child --
     the idiom {cond && <Tab/>} writes exactly that. If Tabs counted with count()
     it would believe it has a tab it will never render, and select it. */
  const html = renderToStaticMarkup(
    <Tabs>{false}<Tab value="dp" label="Deployments"><p>deployments body</p></Tab></Tabs>,
  );
  assert.match(html, /deployments body/, 'the first REAL tab was not selected');
  assert.equal((html.match(/role="tab"/g) || []).length, 1);
});

/* R4, in two separate bodies -- node:assert aborts on the first failure. */
test('Tabs drops a consumer style object', () => {
  const html = renderToStaticMarkup(
    <Tabs style={{ color: '#ff00ff' }}><Tab value="ov" label="Overview" /></Tabs>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tabs drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Tabs data-stray="x"><Tab value="ov" label="Overview" /></Tabs>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
