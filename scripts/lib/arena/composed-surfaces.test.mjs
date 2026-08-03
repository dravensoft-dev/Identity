/* The graph is asserted against the real tree for the three cases that motivated it, because a
 * synthetic fixture would prove the walker and not the claim: React's Table composes Pagination
 * and Select, React's UnauthCard composes Card where Angular's draws the frame itself, and the
 * union is what keeps the two layers' pages identical. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { composedBy, composedGraph, importedComponents } from './composed-surfaces.mjs';
import { repoRoot } from './repo-root.mjs';

test('an import of another component directory is a composition, and nothing else is', () => {
  const path = `${repoRoot}/frameworks/react/components/display/table/Table.tsx`;
  const text = [
    "import { warnOnce } from '../../../WarnOnce.ts';",
    "import manifest from './Table.classes.generated.ts';",
    "import { Pagination } from '../../navigation/pagination/Pagination.tsx';",
    "import { TableRow } from '../table-row/TableRow.tsx';",
    "import React from 'react';",
  ].join('\n');
  assert.deepEqual(importedComponents(text, path, 'react', repoRoot), ['Pagination', 'TableRow']);
});

test('the graph reads every layer, so a composition only one of them makes still counts', () => {
  const graph = composedGraph();
  assert.ok(graph.size > 0, 'an empty graph would let every page link too little and pass');
  assert.ok(graph.get('Table').has('Pagination'), 'both layers compose Pagination inside Table');
  assert.ok(graph.get('UnauthCard').has('Card'),
    'React composes Card and Angular draws the frame itself; the union is what both pages carry');
  assert.ok(graph.get('ConfirmDialog').has('Button'), 'the cancel action is a real Button in React');
});

test('the closure is transitive and excludes what was asked about', () => {
  const graph = new Map([
    ['A', new Set(['B'])],
    ['B', new Set(['C'])],
    ['C', new Set(['A'])],
  ]);
  assert.deepEqual(composedBy(['A'], graph), ['B', 'C']);
  assert.deepEqual(composedBy(['A', 'B'], graph), ['C']);
  assert.deepEqual(composedBy(['Unknown'], graph), []);
});
