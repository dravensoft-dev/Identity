/* Which Arena tokens a stylesheet reads, which names the generated CSS defines, and
 * the union of those with the hand-authored aliases. They sit in lib rather than in
 * any one gate because check-cdk, check-tailwind and check-tailwind-coverage all
 * read them, and a library must not reach up into a gate to do it. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDecls } from '../arena/css-decls.ts';
import { repoRoot } from '../arena/repo-root.ts';

const GENERATED = ['palette.generated.css', 'typography.generated.css', 'spacing.generated.css', 'effects.generated.css'];

export function arenaTokens(root = repoRoot) {
  const names = new Set();
  for (const f of GENERATED)
    for (const decls of parseDecls(readFileSync(join(root, 'contracts', 'design-generated', f), 'utf8')).values())
      for (const name of decls.keys()) names.add(name);
  return names;
}

export function referencedTokens(css: string) {
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
