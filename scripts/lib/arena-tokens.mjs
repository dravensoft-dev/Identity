/* The two readers a CSS bridge needs: which Arena tokens a stylesheet reads, and which
 * token names exist. They lived in check-material.mjs until Plan D deleted that gate with
 * the bridge it verified; check-cdk.mjs is the remaining consumer. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDecls } from './css-decls.mjs';
import { arenaTokens } from '../check-tailwind.mjs';

export function referencedTokens(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/var\(\s*--([a-z0-9-]+)\s*[,)]/g)) out.add(m[1]);
  return out;
}

export function arenaTokenNames(root) {
  const names = arenaTokens(root);
  const colors = parseDecls(readFileSync(join(root, 'contracts', 'design', 'colors.css'), 'utf8'));
  for (const decls of colors.values()) for (const name of decls.keys()) names.add(name);
  return names;
}
