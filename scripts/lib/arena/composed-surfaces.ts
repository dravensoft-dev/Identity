/* Which components a component RENDERS INSIDE ITSELF, read from every layer's own source and
 * unioned. A fixture says what a page instantiates and cannot say this: React's ArenaUnauthCard
 * composes ArenaCard and Angular's draws the same frame from its own manifest, so the answer differs
 * by layer while the page must not, or a difference in the frame reads as a difference in the
 * component. Import graph rather than render: a branch a knob has not taken yet still needs its
 * stylesheet, so a superset is the correct side to err on. */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { LAYERS, pascal } from './layers.mjs';
import { repoRoot } from './repo-root.mjs';

const SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g;
const SOURCE = /\.(tsx?|jsx?|mjs)$/;

export function componentSources(layer, root = repoRoot) {
  const base = join(root, 'frameworks', layer, 'components');
  const found = [];
  if (!existsSync(base)) return found;
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const name = pascal(dir.name);
      for (const ext of ['.tsx', '.ts']) {
        const path = join(base, category.name, dir.name, `${name}${ext}`);
        if (existsSync(path)) { found.push({ name, path }); break; }
      }
    }
  }
  return found;
}

export function importedComponents(text, path, layer, root = repoRoot) {
  const prefix = `frameworks/${layer}/components/`;
  const names = [];
  for (const [, specifier] of text.matchAll(SPECIFIER)) {
    const target = relative(root, resolve(dirname(path), specifier)).split('\\').join('/');
    if (!target.startsWith(prefix)) continue;
    const parts = target.slice(prefix.length).replace(SOURCE, '').split('/');
    if (parts.length !== 3) continue;
    const [, dir, stem] = parts;
    if (stem !== pascal(dir)) continue;
    if (!names.includes(stem)) names.push(stem);
  }
  return names;
}

const cache = new Map();

export function composedGraph(root = repoRoot) {
  const hit = cache.get(root);
  if (hit) return hit;
  const graph = new Map();
  for (const layer of LAYERS) {
    for (const { name, path } of componentSources(layer, root)) {
      const into = graph.get(name) ?? new Set();
      for (const other of importedComponents(readFileSync(path, 'utf8'), path, layer, root)) {
        if (other !== name) into.add(other);
      }
      graph.set(name, into);
    }
  }
  cache.set(root, graph);
  return graph;
}

export function composedBy(names, graph) {
  const seen = new Set(names);
  const queue = [...names];
  while (queue.length > 0) {
    for (const other of graph.get(queue.shift()) ?? []) {
      if (seen.has(other)) continue;
      seen.add(other);
      queue.push(other);
    }
  }
  return [...seen].filter((name) => !names.includes(name)).sort();
}
