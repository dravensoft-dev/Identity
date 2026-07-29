/* Both halves of the Angular Material token bridge fail silently, which is why this
 * gate exists. It checks that a property NAME resolves — never that it is the right
 * name for the element styled, and never the selectors it sits in.
 * DOUBTS.md section 5 states both blind spots. */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { arenaTokens } from './check-tailwind.mjs';

const BRIDGE = join('frameworks', 'angular', 'theme', 'arena-material.css');
const MATERIAL = join('node_modules', '@angular', 'material');

const ORACLE_DIRS = [
  ['fesm2022', '.mjs'],
  ['prebuilt-themes', '.css'],
];

export function bridgeProperties(css) {
  const out = new Set();
  for (const decls of parseDecls(css).values())
    for (const name of decls.keys())
      if (name.startsWith('mat-') || name.startsWith('mdc-')) out.add(name);
  return out;
}

export function referencedTokens(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/var\(\s*--([a-z0-9-]+)\s*[,)]/g)) out.add(m[1]);
  return out;
}

export function materialProperties(pkgDir) {
  const out = new Set();
  for (const [sub, ext] of ORACLE_DIRS) {
    const dir = join(pkgDir, sub);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(ext)) continue;
      const src = readFileSync(join(dir, file), 'utf8');
      for (const m of src.matchAll(/--((?:mat|mdc)-[a-z0-9-]+)/g)) out.add(m[1]);
    }
  }
  return out;
}

export function arenaTokenNames(root) {
  const names = arenaTokens(root);
  const colors = parseDecls(readFileSync(join(root, 'contracts', 'design', 'colors.css'), 'utf8'));
  for (const decls of colors.values()) for (const name of decls.keys()) names.add(name);
  return names;
}

export function checkBridge(bridgeCss, materialProps, tokens) {
  const errs = [];
  for (const name of [...bridgeProperties(bridgeCss)].sort())
    if (!materialProps.has(name))
      errs.push(`--${name} is not read by any installed @angular/material component — it applies nothing and themes nothing`);
  for (const name of [...referencedTokens(bridgeCss)].sort())
    if (!tokens.has(name))
      errs.push(`var(--${name}) names no Arena token — it resolves to nothing`);
  return errs;
}

function main() {
  const dir = join(repoRoot, MATERIAL);
  if (!existsSync(dir)) {
    console.error(`check-material: ${MATERIAL} not found. @angular/material is a devDependency of this repo and the bridge cannot be verified without it — run bun install.`);
    process.exit(1);
  }
  const css = readFileSync(join(repoRoot, BRIDGE), 'utf8');
  const errs = checkBridge(css, materialProperties(dir), arenaTokenNames(repoRoot));

  if (errs.length) {
    console.error(`check-material: ${errs.length} name${errs.length === 1 ? '' : 's'} in ${BRIDGE} resolve${errs.length === 1 ? 's' : ''} to nothing\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const n = bridgeProperties(css).size;
  console.log(`check-material: ${n} bridge properties resolve against @angular/material, every Arena token exists`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
