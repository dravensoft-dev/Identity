/* frameworks/angular/theme/arena-material.css maps Angular Material's custom
 * properties onto Arena's tokens. Both halves of that mapping fail SILENTLY:
 * a property name Material does not read applies nothing, and a var() naming
 * no Arena token resolves to nothing. Neither throws, neither logs, and
 * check-dimension-literals.mjs does not scan .css — so when Material renamed
 * its tokens, 24 of the bridge's 26 names went inert and nothing noticed for
 * a whole major version.
 *
 * WHAT THIS GATE DOES NOT DO: it checks that a name EXISTS, not that it is
 * the right name for the element being styled. The bridge once set
 * --mat-list-list-item-container-{shape,color} on the active nav item; both
 * names exist, but mat-nav-list reads --mat-list-active-indicator-{shape,color}
 * and the container-* pair belongs to mat-selection-list. Catching that needs
 * to know which selector reads which property, which is a different problem.
 * A gate that implies more coverage than it has is how this file rotted.
 *
 *   bun scripts/check-material.mjs   -> exit 0 if every name on both sides resolves
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { arenaTokens } from './check-tailwind.mjs';

const BRIDGE = join('frameworks', 'angular', 'theme', 'arena-material.css');
const MATERIAL = join('node_modules', '@angular', 'material', 'fesm2022');

/** Every Material custom property the bridge DECLARES, without the `--`.
 *  @param {string} css @returns {Set<string>} */
export function bridgeProperties(css) {
  const out = new Set();
  for (const decls of parseDecls(css).values())
    for (const name of decls.keys())
      if (name.startsWith('mat-') || name.startsWith('mdc-')) out.add(name);
  return out;
}

/** Every Arena token the bridge REFERENCES through var(), without the `--`.
 *  Scans the raw text rather than the parsed declarations, so a var() inside
 *  a plain property (font-family, color) counts too.
 *  @param {string} css @returns {Set<string>} */
export function referencedTokens(css) {
  const out = new Set();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of stripped.matchAll(/var\(\s*--([a-z0-9-]+)\s*[,)]/g)) out.add(m[1]);
  return out;
}

/** Every mat- or mdc- custom property name the installed Material package
 *  mentions anywhere in its shipped ES modules, without the `--`.
 *  @param {string} dir @returns {Set<string>} */
export function materialProperties(dir) {
  const out = new Set();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mjs')) continue;
    const src = readFileSync(join(dir, file), 'utf8');
    for (const m of src.matchAll(/--((?:mat|mdc)-[a-z0-9-]+)/g)) out.add(m[1]);
  }
  return out;
}

/** The four generated token files plus tokens/colors.css, whose hand-authored
 *  aliases (--crimson, --mute, --surface-card, --border) the bridge reads and
 *  which arenaTokens() deliberately excludes.
 *  @param {string} root @returns {Set<string>} */
export function arenaTokenNames(root) {
  const names = arenaTokens(root);
  const colors = parseDecls(readFileSync(join(root, 'tokens', 'colors.css'), 'utf8'));
  for (const decls of colors.values()) for (const name of decls.keys()) names.add(name);
  return names;
}

/** @param {string} bridgeCss @param {Set<string>} materialProps
 *  @param {Set<string>} tokens
 *  @returns {string[]} one message per problem, empty when clean. */
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
