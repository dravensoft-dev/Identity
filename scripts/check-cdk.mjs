/* The CDK overlay bridge fails silently the same two ways the Material one does, plus a
 * third: a class the CDK renamed upstream leaves the override matching nothing. So unlike
 * check-material, this gate DOES examine the selectors — it can, because the bridge's whole
 * job is overriding a class the prebuilt sheet defines, and that sheet is the oracle.
 * What it still cannot check is whether the override is the RIGHT value for that class.
 * DOUBTS.md section 5 states that limit alongside the Material bridge's two. */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { arenaTokenNames, referencedTokens } from './check-material.mjs';

const BRIDGE = join('frameworks', 'angular', 'theme', 'arena-cdk.css');
const PREBUILT = join('node_modules', '@angular', 'cdk', 'overlay-prebuilt.css');

export function bridgeSelectors(css) {
  const out = new Set();
  const noAtRules = css.replace(/@[a-z-]+[^;{}]*;/gi, '');
  for (const selector of parseDecls(noAtRules).keys())
    for (const one of selector.split(',')) if (one.trim()) out.add(one.trim());
  return out;
}

export function cdkClasses(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/\.(cdk-[a-z0-9-]+)/g)) out.add(m[1]);
  return out;
}

export function importedSheets(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/@import\s+['"]([^'"]+)['"]/g)) out.add(m[1]);
  return out;
}

export function checkBridge(bridgeCss, prebuiltCss, tokens, resolveSheet) {
  const errs = [];
  const selectors = bridgeSelectors(bridgeCss);
  const named = cdkClasses(bridgeCss);
  const defined = cdkClasses(prebuiltCss);
  const referenced = referencedTokens(bridgeCss);
  const imported = importedSheets(bridgeCss);

  if (selectors.size === 0)
    errs.push(`${BRIDGE} declares no rule at all — a bridge that overrides nothing is not a bridge, and this gate would pass it by finding nothing to check`);
  if (named.size === 0)
    errs.push(`${BRIDGE} names no cdk-* class — it cannot be overriding the CDK, so either the selectors are wrong or this file has stopped being the CDK bridge`);
  if (referenced.size === 0)
    errs.push(`${BRIDGE} references no Arena token — its whole reason to exist is putting the CDK's hardcoded z-index on Arena's scale, and a bridge with no var() has stopped doing that`);
  if (imported.size === 0)
    errs.push(`${BRIDGE} imports no stylesheet — the CDK overlay needs its prebuilt structural CSS in scope, and without it every overlay renders unpositioned`);

  for (const name of [...named].sort())
    if (!defined.has(name))
      errs.push(`.${name} is defined by no installed @angular/cdk overlay class — the override matches nothing, and the CDK renaming a class is exactly how this breaks with the whole suite green`);

  for (const name of [...referenced].sort())
    if (!tokens.has(name))
      errs.push(`var(--${name}) names no Arena token — it resolves to nothing`);

  for (const sheet of [...imported].sort())
    if (!resolveSheet(sheet))
      errs.push(`@import '${sheet}' resolves to no file under node_modules — the import is silently dropped and every overlay renders unpositioned`);

  return errs;
}

function main() {
  const prebuilt = join(repoRoot, PREBUILT);
  if (!existsSync(prebuilt)) {
    console.error(`check-cdk: ${PREBUILT} not found. @angular/cdk is a devDependency of this repo and the bridge cannot be verified without it — run bun install.`);
    process.exit(1);
  }
  const css = readFileSync(join(repoRoot, BRIDGE), 'utf8');
  const errs = checkBridge(
    css,
    readFileSync(prebuilt, 'utf8'),
    arenaTokenNames(repoRoot),
    (sheet) => existsSync(join(repoRoot, 'node_modules', sheet)),
  );

  if (errs.length) {
    console.error(`check-cdk: ${errs.length} problem${errs.length === 1 ? '' : 's'} in ${BRIDGE}\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const n = cdkClasses(css).size;
  console.log(`check-cdk: ${n} overridden CDK class${n === 1 ? ' exists' : 'es exist'}, every Arena token resolves, every @import resolves`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
