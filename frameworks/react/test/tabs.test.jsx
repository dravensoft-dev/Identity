import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Tabs } from '../components/navigation/Tabs.jsx';

/* This directory renders with renderToStaticMarkup and has no DOM, so no test here
 * fires a click. The `change` event's payload -- the chosen tab's value as a string --
 * is therefore NOT verified by this suite. What IS verified is the half SSR can see:
 * that a tab's `value` and `label` are drawn into their own places now that the
 * bare-string branch is gone, that `value` selects exactly one tab, and that neither
 * R4 escape is left.
 *
 * Every fixture's value and label DIFFER on purpose. A same-string fixture cannot
 * discriminate a component that draws the value as the tab's text, or one that keys
 * the selection off the label.
 *
 * React's SSR does not emit attributes in source order, so nothing below assumes
 * adjacency. */

test('a tab draws its label as its text, and its value never reaches the page as text', () => {
  const html = renderToStaticMarkup(
    <Tabs tabs={[{ value: 'ov', label: 'Overview' }, { value: 'dp', label: 'Deployments' }]} />,
  );
  assert.match(html, /<button[^>]*>Overview<\/button>/);
  assert.match(html, /<button[^>]*>Deployments<\/button>/);
  assert.doesNotMatch(html, />ov</, 'a tab drew its value as its text, not its label');
});

test('value selects the tab whose `value` matches, and only that tab wears the crimson underline', () => {
  const html = renderToStaticMarkup(
    <Tabs value="dp" tabs={[{ value: 'ov', label: 'Overview' }, { value: 'dp', label: 'Deployments' }]} />,
  );
  /* The underline sits on Deployments -- so the selection was keyed off `value`,
   * not off the label, which is a different string. */
  assert.match(html, /<button[^>]*var\(--crimson\)[^>]*>Deployments<\/button>/);
  /* And on nothing else: counted, because asserting presence alone passes a
   * component that underlines every tab. */
  assert.equal((html.match(/var\(--crimson\)/g) || []).length, 1,
    'more than one tab wore the active underline');
});

/* R4: `style` left the component, and there is no {...rest} to put back. Asserted in
 * two separate tests -- node:assert aborts on the first failure, so one body asserting
 * both cannot discriminate which escape came back. */
test('Tabs drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Tabs tabs={[{ value: 'ov', label: 'Overview' }]} style={{ color: '#ff00ff' }} />,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered root -- the R4 escape is back');
});

test('Tabs drops a consumer attribute -- no {...rest} spread reaches the root', () => {
  const html = renderToStaticMarkup(
    <Tabs tabs={[{ value: 'ov', label: 'Overview' }]} data-stray="x" />,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered root -- a {...rest} escape is back');
});

/* `tabs` is declared required in the contract, and api/README.md's required-ness
 * rule says the implementation fails hard rather than rendering with a missing
 * value. Before this it defaulted to `[]` and `<Tabs />` drew an empty bar. It
 * guards absence only -- an empty array is a caller saying "no tabs right now",
 * which every other required-array guard in the layer accepts. */
test('tabs is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Tabs />),
    /Tabs: `tabs` is required/,
  );
});

test('an empty tabs array renders rather than throwing', () => {
  assert.doesNotThrow(() => renderToStaticMarkup(<Tabs tabs={[]} />));
});
