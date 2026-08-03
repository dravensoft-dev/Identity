/* The framework layers and the two name shapes every gate reads them through.
 * LAYERS is an exhaustive enumeration rather than a walk of frameworks/, so a
 * layer renamed or removed wholesale becomes loud instead of leaving scope.
 * NON_LAYERS is the other half of that claim: a directory under frameworks/ is
 * one or the other, so a new one fails until somebody says which, rather than
 * being read as a layer no gate implements or a layer every gate skips.
 * emittedTree is anchored rather than a directory name: a walker skipping every
 * directory called build would also skip scripts/build/, the phase directory. */

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './repo-root.mjs';

export const LAYERS = ['tailwind', 'angular', 'react'];

export const NON_LAYERS = new Map([
  ['demos', 'the playground fixtures: one fact per component that belongs to every layer and to none, so a copy per layer is a copy that can disagree'],
]);

export const emittedTree = (root = repoRoot) => join(root, 'frameworks', 'angular', 'build');

export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function pascal(dir) {
  return dir.replace(/(^|-)([a-z0-9])/g, (_, _sep, c) => c.toUpperCase());
}

export function readLayer(layer) {
  const base = join(repoRoot, 'frameworks', layer, 'components');
  if (!existsSync(base)) return {};
  const out = {};
  for (const cat of readdirSync(base, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    out[cat.name] = readdirSync(join(base, cat.name), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }
  return out;
}
