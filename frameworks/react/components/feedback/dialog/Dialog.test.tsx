import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { Dialog } from './Dialog.tsx';

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

  const id = labelledBy[1]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

test('Dialog drops a consumer style object -- the ...style escape is gone', () => {
  const html = renderToStaticMarkup(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
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

test('title is required and its absence throws', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<Dialog open onClose={() => {}}><p>b</p></Dialog>),
    /Dialog: `title` is required/,
  );
});

test('open is required and its absence throws, while false renders nothing and does not', () => {
  assert.throws(
    // @ts-expect-error the contract refuses this on purpose, and the render is what this asserts
    () => renderToStaticMarkup(<Dialog title={TITLE}><p>b</p></Dialog>),
    /Dialog: `open` is required/,
  );
  assert.doesNotThrow(
    () => renderToStaticMarkup(<Dialog open={false} title={TITLE}><p>b</p></Dialog>),
  );
});

test('the footer wraps, because the slot takes one control per element', () => {
  const html = renderToStaticMarkup(
    <Dialog open title={TITLE} onClose={() => {}}
      footer={<><button type="button">Cancel</button><button type="button">Charge in full</button><button type="button">Record</button></>}>
      <p>b</p>
    </Dialog>,
  );
  assert.match(html, /flex-wrap:\s*wrap/,
    'three buttons at 390px overflow the panel without it, and the row is what has to wrap '
    + 'because the consumer passes siblings rather than a wrapper of their own; PageHead and '
    + 'ChartCard already do this, and a third action row behaving differently is worse than none');
});
