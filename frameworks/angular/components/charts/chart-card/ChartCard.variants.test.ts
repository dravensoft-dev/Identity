import test from 'node:test';
import assert from 'node:assert/strict';
import { chartCardStyles } from './ChartCard.variants';

test('the root slot carries a display utility, so host-binding it never collapses to the UA-default inline box', () => {
  assert.match(chartCardStyles().root(), /\bflex\b/);
});

test('the root is a bordered tile, not a heading-bearing panel -- background, border and radius come from the surface scale, not a danger or accent surface', () => {
  const root = chartCardStyles().root();
  assert.match(root, /\bbg-base-200\b/);
  assert.match(root, /border-\[length:var\(--bw\)\]/);
  assert.match(root, /\bborder-base-300\b/);
  assert.match(root, /\brounded-lg\b/);
  assert.doesNotMatch(root, /error/, 'a chart tile is neutral chrome, never a danger surface');
});

test('the title slot is an uppercase mono microlabel, never heading typography', () => {
  const title = chartCardStyles().title();
  assert.match(title, /\bfont-mono\b/);
  assert.match(title, /\buppercase\b/);
  assert.match(title, /\btracking-label\b/);
  assert.doesNotMatch(title, /\bfont-display\b/, 'a microlabel must not carry the display heading font');
  assert.doesNotMatch(title, /\btext-h[1-4]\b/, 'a microlabel must not carry a heading-scale size -- that would fabricate a document outline');
});

test('the head row spaces the title and the actions to opposite ends, the layout the optional-slot gate exists to protect', () => {
  const head = chartCardStyles().head();
  assert.match(head, /\bjustify-between\b/);
  assert.match(head, /\bitems-center\b/);
});

test('the manifest carries no variants -- title and actions are conditionally rendered by the component, never enumerable classes', () => {
  const styles = chartCardStyles();
  for (const slot of ['root', 'head', 'title', 'actions'] as const) {
    assert.equal(typeof styles[slot](), 'string');
    assert.ok(styles[slot]().length > 0, `${slot} resolved to an empty class string`);
  }
});

test('the head row and the actions row both wrap, because the slot projects one element per control', () => {
  assert.match(chartCardStyles().head(), /\bflex-wrap\b/);
  assert.match(
    chartCardStyles().actions(),
    /\bflex-wrap\b/,
    'a title and three buttons at 390px overflow the tile without it, and the row is what has to '
    + 'wrap because the consumer projects siblings rather than a wrapper of their own',
  );
});
