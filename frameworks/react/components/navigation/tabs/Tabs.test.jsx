import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tabs } from './Tabs.jsx';
import { Tab } from '../tab/Tab.jsx';

const three = (props = {}) => (
  <Tabs {...props}>
    <Tab value="ov" label="Overview"><p>overview body</p></Tab>
    <Tab value="dp" label="Deployments"><p>deployments body</p></Tab>
  </Tabs>
);

const panelTags = (html) => (html.match(/<div\b[^>]*>/g) || []).filter((t) => t.includes('role="tabpanel"'));
const visiblePanels = (html) => panelTags(html).filter((t) => !t.includes(' hidden='));

const tabTags = (html) => (html.match(/<button\b[^>]*>/g) || []).filter((t) => t.includes('role="tab"'));

test('one tabpanel per tab is rendered, and exactly one of them is visible', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
  assert.equal(panelTags(html).length, 2,
    'a panel per tab must exist, or the unselected tabs\' aria-controls dangle');
  assert.equal(visiblePanels(html).length, 1,
    'a widget shows exactly one panel -- the selected tab\'s');
});

test('the selected tab\'s panel is the visible one, and no other tab\'s is', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'dp' }));
  assert.match(html, /deployments body/);

  assert.match(html, /overview body/);
  const shown = visiblePanels(html);
  assert.equal(shown.length, 1);
  const shownId = /\sid="([^"]+)"/.exec(shown[0])[1];
  const selected = /<button\b[^>]*aria-selected="true"[^>]*>/.exec(html)[0];
  assert.equal(/aria-controls="([^"]+)"/.exec(selected)[1], shownId,
    'the visible panel is not the selected tab\'s');
});

test('every tab\'s aria-controls resolves to an id that exists in the same markup', () => {
  const html = renderToStaticMarkup(three({ defaultValue: 'ov' }));
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(controls.length, 2, 'every tab must carry an aria-controls');
  const dangling = controls.filter((c) => !ids.has(c));
  assert.deepEqual(dangling, [],
    `aria-controls pointing at nothing: ${dangling.join(', ')} -- a dangling reference is not a reference`);
});

test('a value naming no tab selects nothing and still leaves exactly one tab stop', () => {
  const html = renderToStaticMarkup(three({ value: 'nope' }));
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 0,
    'a tab was selected that the consumer did not ask for');
  assert.equal(tabTags(html).filter((t) => t.includes('tabindex="0"')).length, 1,
    'the strip has no tab stop at all -- it cannot be reached by keyboard');
});

test('a value naming no tab shows no panel and dangles no label', () => {
  const html = renderToStaticMarkup(three({ value: 'nope' }));
  assert.equal(visiblePanels(html).length, 0, 'a panel is shown for a tab that is not selected');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, ref] of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    assert.ok(ids.has(ref), `aria-labelledby="${ref}" points at nothing`);
  }
});

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

test('no children renders an empty tablist and no tabpanel at all', () => {
  const html = renderToStaticMarkup(<Tabs />);
  assert.match(html, /role="tablist"/);
  assert.doesNotMatch(html, /role="tabpanel"/, 'a tabpanel was rendered with no tab to label it');
  assert.doesNotMatch(html, /aria-labelledby/);
});

test('a conditionally-rendered tab that is false is absent, not counted', () => {

  const html = renderToStaticMarkup(
    <Tabs>{false}<Tab value="dp" label="Deployments"><p>deployments body</p></Tab></Tabs>,
  );
  assert.match(html, /deployments body/, 'the first REAL tab was not selected');
  assert.equal((html.match(/role="tab"/g) || []).length, 1);
});

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
