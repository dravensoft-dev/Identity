import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Dialog } from './Dialog.jsx';

/* This suite carries no `.dom.` infix, so it renders with renderToStaticMarkup and
 * has no DOM, and nothing here
 * presses a key or clicks the scrim. The `close` event's two triggers -- Escape and
 * a scrim click -- are therefore NOT verified by this suite; they are pinned against
 * a real tree in ../DialogModal.dom.test.jsx and ../Behavioural.dom.test.jsx.
 * What IS verified here is the contract SHAPE that SSR can see: that every member
 * api/components/Dialog.json declares reaches its declared place in the markup, that
 * `width` is a CSS string rather than the number the .d.ts used to declare, that the
 * two required members fail hard when absent, and that neither R4 escape is present.
 *
 * `title` now throws when missing, so every render below passes one. */

const TITLE = 'Delete project';

test('the content slot renders as children, and the footer slot as its own row', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} footer={<button type="button">Confirm</button>}>
      <p>This cannot be undone.</p>
    </Dialog>,
  );
  assert.match(html, /<p>This cannot be undone\.<\/p>/);
  assert.match(html, /<button type="button">Confirm<\/button>/);
});

test('an absent footer renders no action row at all', () => {
  const withFooter = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} footer={<button type="button">Confirm</button>}><p>b</p></Dialog>,
  );
  const without = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE}><p>b</p></Dialog>,
  );
  /* Counted rather than asserted by presence: the action row is the only element in
   * the panel carrying justify-content:flex-end, so one against zero discriminates a
   * component that ships an empty row unconditionally. */
  assert.equal((withFooter.match(/justify-content:flex-end/g) || []).length, 1);
  assert.equal((without.match(/justify-content:flex-end/g) || []).length, 0,
    'an empty action row shipped with no footer passed');
});

test('title is drawn, and the panel names itself with the element that carries it', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE}><p>b</p></Dialog>,
  );
  const labelledBy = /aria-labelledby="([^"]+)"/.exec(html);
  assert.ok(labelledBy, 'the panel declared no aria-labelledby');
  /* The id must be on the element drawing the title -- an aria-labelledby pointing at
   * nothing, or at the wrong node, satisfies a presence check and names the dialog
   * "dialog" to a screen reader. React's SSR does not emit attributes in source
   * order, so this reads the id back out rather than assuming adjacency. */
  const id = labelledBy[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titled = new RegExp(`<div id="${id}"[^>]*>${TITLE}</div>`);
  assert.match(html, titled, 'aria-labelledby did not point at the element drawing the title');
});

test('eyebrow is drawn above the title when given, and nothing is drawn when it is not', () => {
  const withEyebrow = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} eyebrow="Confirm"><p>b</p></Dialog>,
  );
  assert.match(withEyebrow, />Confirm</);
  assert.ok(withEyebrow.indexOf('>Confirm<') < withEyebrow.indexOf(`>${TITLE}<`),
    'the eyebrow was drawn after the title');
  const without = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE}><p>b</p></Dialog>,
  );
  assert.doesNotMatch(without, /text-transform:uppercase/, 'an empty eyebrow row was drawn');
});

/* `width` is a string in the contract and was declared `number` in the .d.ts until
 * this batch. The two tests below are what makes that a fact about the component and
 * not only about a declaration: React appends px to a bare number in a style object,
 * so a number member could never carry either token expression asserted here. */
test('width takes a CSS string and reaches the panel verbatim', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} width="calc(var(--sp-1) * 200)"><p>b</p></Dialog>,
  );
  assert.match(html, /width:calc\(var\(--sp-1\) \* 200\)/);
});

test('an omitted width falls back to a CSS string, never a number', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE}><p>b</p></Dialog>,
  );
  assert.match(html, /width:calc\(var\(--sp-1\) \* 120\)/);
});

test('open governs whether anything renders at all', () => {
  assert.equal(
    renderToStaticMarkup(<Dialog open={false} onClose={() => {}} title={TITLE}><p>b</p></Dialog>),
    '',
    'a closed dialog rendered markup',
  );
  assert.notEqual(
    renderToStaticMarkup(<Dialog open onClose={() => {}} title={TITLE}><p>b</p></Dialog>),
    '',
  );
});

/* R4: `style` is not a member and there is no {...rest} to put back. Asserted in two
 * separate tests -- node:assert aborts on the first failure, so one body asserting
 * both cannot discriminate which escape came back. Both were induced separately
 * against this suite and each failed alone. */
test('Dialog drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} style={{ color: '#ff00ff' }}><p>b</p></Dialog>,
  );
  assert.doesNotMatch(html, /#ff00ff/, 'a consumer style reached the rendered panel -- the R4 escape is back');
});

test('Dialog drops a consumer attribute -- no {...rest} spread reaches the panel', () => {
  const html = renderToStaticMarkup(
    <Dialog open onClose={() => {}} title={TITLE} data-stray="x"><p>b</p></Dialog>,
  );
  assert.doesNotMatch(html, /data-stray/, 'a consumer attribute reached the rendered panel -- a {...rest} escape is back');
});

/* Both members the contract marks required, and api/README.md's rule that the
 * implementation fails hard rather than rendering with a missing value. */
test('title is required and its absence throws', () => {
  assert.throws(
    () => renderToStaticMarkup(<Dialog open onClose={() => {}}><p>b</p></Dialog>),
    /Dialog: `title` is required/,
  );
});

test('open is required and its absence throws, while false renders nothing and does not', () => {
  assert.throws(
    () => renderToStaticMarkup(<Dialog title={TITLE}><p>b</p></Dialog>),
    /Dialog: `open` is required/,
  );
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Dialog open={false} title={TITLE}><p>b</p></Dialog>),
  );
});
