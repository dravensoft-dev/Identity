/* Compiles Arena's Tailwind layer and asserts the whole chain resolves —
 * manifest class -> emitted rule -> theme key -> Arena token. Compiling is not
 * the assertion; a layer that compiles and silently resolves to Tailwind's own
 * defaults is exactly the failure this exists to catch.
 *
 *   bun scripts/check-tailwind.mjs      -> exit 0 if the layer resolves, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseDecls } from './lib/css-decls.mjs';
import { compileLayer, manifestClasses, escapeClass, repoRoot } from './lib/tailwind-compile.mjs';

const GENERATED = ['palette.css', 'typography.css', 'spacing.css', 'effects.css'];

/** Every Arena token name (without `--`) declared in the four generated files. */
export function arenaTokens(root = repoRoot) {
  const names = new Set();
  for (const f of GENERATED)
    for (const decls of parseDecls(readFileSync(join(root, 'tokens', f), 'utf8')).values())
      for (const name of decls.keys()) names.add(name);
  return names;
}

/** The theme keys the compiled output emits into :root, mapped to their values.
 *  @param {string} css @returns {Map<string,string>} */
export function themeKeys(css) {
  const out = new Map();
  const m = css.match(/@layer theme\s*\{\s*:root[^{]*\{([\s\S]*?)\n\s*\}/);
  if (!m) return out;
  for (const line of m[1].split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const name = line.slice(0, i).trim();
    if (!name.startsWith('--')) continue;
    out.set(name.slice(2), line.slice(i + 1).trim());
  }
  return out;
}

/** @param {string} css @param {Map<string,object>} manifests @param {Set<string>} tokens
 *  @returns {string[]} violations */
export function checkCompiled(css, manifests, tokens) {
  const errs = [];

  // Every class a manifest declares must have produced a rule. This is what
  // holds up a manifest with no consumer anywhere in the repo.
  for (const [file, manifest] of manifests)
    for (const cls of manifestClasses(manifest))
      if (!css.includes(`.${escapeClass(cls)}`))
        errs.push(`${file}: \`${cls}\` produced no rule — the utility does not exist`);

  // Every theme key must be a var() into a token that really exists.
  for (const [key, value] of themeKeys(css)) {
    if (key.startsWith('tw-') || key.startsWith('default-')) continue;
    const ref = value.match(/^var\(--([a-z0-9-]+)\)$/);
    if (!ref) { errs.push(`--${key}: not a var() into an Arena token — emits \`${value}\``); continue; }
    if (!tokens.has(ref[1])) errs.push(`--${key}: --${ref[1]} is no such Arena token`);
  }

  // Tailwind's default --spacing must be unreachable (see the spec, 1b).
  if (css.includes('0.25rem'))
    errs.push("the compiled layer contains `0.25rem` — Tailwind's default --spacing is reachable; set `--spacing: var(--sp-1)`");

  return errs;
}

function main() {
  const { css, manifests } = compileLayer();
  const errs = checkCompiled(css, manifests, arenaTokens());
  if (errs.length) {
    console.error(`check-tailwind: ${errs.length} violation(s) in the compiled Tailwind layer\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const classes = [...manifests.values()].reduce((n, m) => n + manifestClasses(m).length, 0);
  console.log(`check-tailwind: ${manifests.size} manifest(s), ${classes} class(es), ${themeKeys(css).size} theme key(s) — all resolve to Arena tokens`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
