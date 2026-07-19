import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flattenTokens, previewFor } from './lib/token-preview.mjs';
import { parseDecls } from './lib/css-decls.mjs';
import { FILES } from './build-tokens.mjs';

test('flattens a nested group into dash-joined custom-property names', () => {
  const out = flattenTokens({
    r: { $type: 'dimension', sm: { $value: { value: 6, unit: 'px' }, $description: 'buttons' } },
  });
  assert.deepEqual(out, [
    { name: 'r-sm', group: 'r', path: ['r', 'sm'], $type: 'dimension', $description: 'buttons' },
  ]);
});

test('inherits $type from the nearest ancestor group', () => {
  const out = flattenTokens({ fw: { $type: 'fontWeight', bold: { $value: 700 } } });
  assert.equal(out[0].$type, 'fontWeight');
});

test('handles a top-level leaf token, whose group is its own name', () => {
  const out = flattenTokens({ 'container-max': { $type: 'dimension', $value: { value: 1240, unit: 'px' } } });
  assert.deepEqual(out, [
    { name: 'container-max', group: 'container-max', path: ['container-max'], $type: 'dimension', $description: undefined },
  ]);
});

test('keeps source order and omits group nodes themselves', () => {
  const out = flattenTokens({
    sp: { $type: 'dimension', 0: { $value: { value: 0, unit: 'px' } }, 1: { $value: { value: 4, unit: 'px' } } },
    gutter: { $type: 'dimension', $value: { value: 88, unit: 'px' } },
  });
  assert.deepEqual(out.map((t) => t.name), ['sp-0', 'sp-1', 'gutter']);
});

test('maps each group to its own preview shape', () => {
  assert.equal(previewFor('color', 'color'), 'swatch');
  assert.equal(previewFor('fs', 'dimension'), 'size');
  assert.equal(previewFor('sp', 'dimension'), 'bar');
  assert.equal(previewFor('r', 'dimension'), 'radius');
  assert.equal(previewFor('dz', 'dimension'), 'control');
  assert.equal(previewFor('bp', 'dimension'), 'breakpoint');
  assert.equal(previewFor('shadow', 'shadow'), 'elevation');
  assert.equal(previewFor('ease', 'cubicBezier'), 'easing');
  assert.equal(previewFor('ls', 'number'), 'tracking');
  assert.equal(previewFor('lh', 'number'), 'leading');
});

test('an unmapped group falls back to its type, never to nothing', () => {
  assert.equal(previewFor('brandnew', 'dimension'), 'bar');
  assert.equal(previewFor('brandnew', 'color'), 'swatch');
  assert.equal(previewFor('brandnew', 'duration'), 'duration');
  assert.equal(previewFor('brandnew', 'number'), 'value');
});

test('an unknown type still yields a renderable shape rather than undefined', () => {
  assert.equal(previewFor('brandnew', 'gradient'), 'value');
});

/** Regroups build-tokens.mjs's own FILES (one entry per output file, each
 *  carrying an ordered list of {selector, source} blocks — some output files
 *  have two blocks sharing one selector, e.g. effects.css's :root fed by both
 *  effects.json and layering.json) into (sources[], css, selector) triples.
 *  Deriving this from FILES, rather than re-declaring the mapping by hand
 *  below, is the point: a new source file wired into the build is picked up
 *  here automatically, with no matching edit needed in this test. */
function deriveCases(files) {
  const cases = [];
  for (const file of files) {
    const bySelector = new Map();
    for (const { selector, source } of file.blocks) {
      if (!bySelector.has(selector)) bySelector.set(selector, []);
      bySelector.get(selector).push(`tokens/src/${source}`);
    }
    for (const [selector, sources] of bySelector) cases.push([sources, `tokens/${file.out}`, selector]);
  }
  return cases;
}

/* The page looks tokens up as --<name> via getComputedStyle. If this module derived
 * names differently from the build, every lookup would silently return "". */
test('derived names match the custom properties the build actually emits', () => {
  const cases = deriveCases(FILES);
  assert.ok(cases.length >= 4, 'expected at least one case per output file');
  for (const [sources, css, selector] of cases) {
    const derived = sources
      .flatMap((s) => flattenTokens(JSON.parse(readFileSync(s, 'utf8'))).map((t) => t.name))
      .sort();
    const emitted = [...parseDecls(readFileSync(css, 'utf8')).get(selector).keys()].sort();
    assert.deepEqual(derived, emitted, `${sources.join(', ')} -> ${css} ${selector}`);
  }
});
