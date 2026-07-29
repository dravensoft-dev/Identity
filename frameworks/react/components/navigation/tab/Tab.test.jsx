import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tab } from './Tab.jsx';

/* This directory has no DOM and renders with renderToStaticMarkup, so nothing here
 * fires a click. What it CAN see is the whole of Tab's markup contract: the element,
 * the roles and states it carries, the tab stop it takes, and the two R4 escapes.
 * The behaviour -- that clicking selects, that an arrow moves focus -- belongs to
 * Tabs and is asserted in ../tabs/Tabs.dom.test.jsx.
 *
 * Every fixture's `value` and `label` DIFFER on purpose. A same-string fixture
 * cannot discriminate a component that draws the value as its text. */

test('a tab is a native button carrying role=tab and drawing its label', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" />);
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /<button[^>]*role="tab"/);
  assert.match(html, />Overview<\/button>/);
  assert.doesNotMatch(html, />ov</, 'a tab drew its value as its text, not its label');
});

test('the injected wiring reaches the attributes that need it', () => {
  const html = renderToStaticMarkup(
    <Tab value="ov" label="Overview" selected tabId="t-ov" panelId="p-ov" />,
  );
  assert.match(html, /id="t-ov"/);
  assert.match(html, /aria-controls="p-ov"/);
});

/* states.selected of the `tabs` pattern says "true on the active tab, FALSE on the
 * rest" -- so the unselected case is asserted rather than assumed, because omitting
 * the attribute would read as met to a careless eye and is not what is asked for. */
test('aria-selected is true when selected and false when not', () => {
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" selected />), /aria-selected="true"/);
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" />), /aria-selected="false"/);
});

/* focus.roving: exactly one tab stop in the strip, and WHICH tab holds it is
 * `Tabs`' decision, injected as `tabStop` rather than derived here from
 * `selected`. The two coincide in the ordinary case and part company whenever the
 * active value names no tab -- and deriving one from the other put every tab at
 * -1 there, which is a widget with no keyboard route into it at all. This is the
 * structural half, which SSR can hold; that the stop MOVES is in the DOM suite. */
test('the tab stop is the injected one, not an inference from `selected`', () => {
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" selected tabStop />), /tabindex="0"/);
  assert.match(renderToStaticMarkup(<Tab value="ov" label="Overview" />), /tabindex="-1"/);
});

test('a tab can hold the stop without being selected, and be selected without holding it', () => {
  /* The first is what a strip whose active value names no tab renders, and it is
     the case the widget cannot be operated without. The second is unreachable
     from Tabs today and is asserted so the two stay genuinely independent. */
  const stopOnly = renderToStaticMarkup(<Tab value="ov" label="Overview" tabStop />);
  assert.match(stopOnly, /tabindex="0"/);
  assert.match(stopOnly, /aria-selected="false"/);
  const selectedOnly = renderToStaticMarkup(<Tab value="ov" label="Overview" selected />);
  assert.match(selectedOnly, /tabindex="-1"/);
  assert.match(selectedOnly, /aria-selected="true"/);
});

test('value is required and its absence throws', () => {
  assert.throws(() => renderToStaticMarkup(<Tab label="Overview" />), /Tab: `value` is required/);
});

test('label is required and its absence throws', () => {
  assert.throws(() => renderToStaticMarkup(<Tab value="ov" />), /Tab: `label` is required/);
});

/* Both guards are falsy rather than absence-only: `label` is the tab's whole
 * accessible name and `value` is what the selection is keyed off, so a
 * present-but-blank value IS the defect and `== null` would let it through. */
test('a blank label is refused, not drawn', () => {
  assert.throws(() => renderToStaticMarkup(<Tab value="ov" label="" />), /Tab: `label` is required/);
});

/* R4, asserted in two separate bodies -- node:assert aborts on the first failure,
   so one body asserting both escapes cannot say which came back. */
test('Tab drops a consumer style object', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" style={{ color: '#ff00ff' }} />);
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tab drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(<Tab value="ov" label="Overview" data-stray="x" />);
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root');
});
