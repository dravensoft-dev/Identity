import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import {
  renderCatalog, renderRow, renderPatterns, memberList, escapeCell,
  promptLink, layersFor, CATALOG_TARGET, CATALOG_LAYERS,
} from './generate-catalog.mjs';

test('a required member is starred and an optional one is not', () => {
  const members = memberList({ api: { label: { required: true }, dim: {} } });
  assert.deepEqual(members, ['label*', 'dim']);
});

test('memberList keeps contract order, because the contract orders by what a reader needs first', () => {
  const members = memberList({ api: { content: {}, variant: {}, size: {} } });
  assert.deepEqual(members, ['content', 'variant', 'size']);
});

test('a pattern every layer binds is named once, unqualified', () => {
  const found = new Map([['button', new Set(['angular', 'react'])]]);
  assert.equal(renderPatterns(found, ['angular', 'react']), 'button');
});

test('a pattern only one layer binds is qualified by that layer, so a divergence is visible', () => {
  const found = new Map([['button', new Set(['react'])]]);
  assert.equal(renderPatterns(found, ['angular', 'react']), 'button (react)');
});

test('a cased binding contributes every distinct pattern, sorted', () => {
  const found = new Map([
    ['none', new Set(['angular', 'react'])],
    ['button', new Set(['angular', 'react'])],
  ]);
  assert.equal(renderPatterns(found, ['angular', 'react']), 'button, none');
});

test('a pipe in a description is escaped, so one cannot split a table row', () => {
  assert.equal(escapeCell('a | b'), 'a \\| b');
});

test('a newline in a description becomes a space, because a table cell is one line', () => {
  assert.equal(escapeCell('a\nb'), 'a b');
});

test('a prompt link is relative to frameworks/, which is where the catalog sits', () => {
  assert.equal(
    promptLink('react', 'forms', 'Button'),
    '[react](./react/components/forms/button/Button.prompt.md)',
  );
});

test('the tailwind layer is not a catalog layer: it ships manifests, not components', () => {
  assert.ok(!CATALOG_LAYERS.includes('tailwind'));
  assert.deepEqual([...CATALOG_LAYERS].sort(), ['angular', 'react']);
});

test('layersFor reports only the layers that actually hold the directory', () => {
  assert.deepEqual(layersFor('forms', 'Button').sort(), ['angular', 'react']);
  assert.deepEqual(layersFor('forms', 'NoSuchComponent'), []);
});

test('a row names the component, its members and its usage links', () => {
  const row = renderRow({
    component: 'Badge', description: 'Status label.', layers: ['react'],
    members: ['tone', 'dot'], patterns: 'none',
    prompts: ['[react](./react/components/display/badge/Badge.prompt.md)'],
  });
  assert.match(row, /^\| `Badge` \| Status label\. \| `tone` `dot` \| none \| \[react\]/);
});

test('a component with no binding reads as undeclared rather than as the pattern named none', () => {
  const row = renderRow({
    component: 'X', description: 'd', layers: ['react'], members: [], patterns: '', prompts: [],
  });
  assert.match(row, /\| \(no members\) \| \(undeclared\) \| \(no layer\) \|$/);
});

test('the emitted catalog is what is committed, so a reader of the tag reads the truth', () => {
  const committed = readFileSync(join(repoRoot, CATALOG_TARGET), 'utf8');
  assert.equal(renderCatalog(), committed);
});

test('the catalog names every component and stays clear of the punctuation rule', () => {
  const out = renderCatalog();
  const declared = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));
  for (const names of Object.values(declared)) {
    for (const name of names) assert.ok(out.includes(`\`${name}\``), `catalog omits ${name}`);
  }
  assert.ok(!out.includes('—'), 'the catalog carries an em dash, which check:docs bans in a document');
});
