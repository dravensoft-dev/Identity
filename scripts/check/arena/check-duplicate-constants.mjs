/* Fails when the same module-level named numeric constant is declared in BOTH
 * framework layers. Module-level-in-both is narrower than "duplicated": a design value declared
 * in ONE layer, and a constant declared inside a function body in EITHER, both escape. The two
 * layers do not share an idiom for where a design number lives, so that happens often. */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, extname, relative } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { emittedTree } from '../../lib/arena/layers.mjs';

const EXEMPT = new Map([
  ['SSR_VIEWPORT_H',
   'Not a design value and so not a token: it stands in for window.innerHeight where there is no '
   + 'window, which is a rendering assumption rather than a decision anybody made. Both layers need '
   + 'the same stand-in for the same reason, and authoring it in contracts/design/ would put a '
   + 'number nobody chose into the Overview beside values that were chosen. Onboarding is the one '
   + 'component that compares against viewport HEIGHT; the reserve it subtracts IS a token '
   + '(--onboarding-height-reserve).'],
]);

export function numericConstants(source) {
  const found = new Map();
  const re = /^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/gm;
  for (const m of source.matchAll(re)) {
    const raw = m[2].replace(/\s*as\s+const\s*$/, '').trim();
    if (/^-?\d+(\.\d+)?$/.test(raw)) { found.set(m[1], raw); continue; }
    if (/^\{[^{}]*\}$/.test(raw)) {
      const body = raw.slice(1, -1).trim();
      if (body && /^([\w$]+\s*:\s*-?\d+(\.\d+)?\s*,?\s*)+$/.test(body)) {
        found.set(m[1], `{${body.replace(/\s+/g, '').replace(/,$/, '')}}`);
      }
    }
  }
  return found;
}

const SCAN_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

export function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'vendor' || entry === 'dist') continue;
    const path = join(dir, entry);
    if (path === emittedTree()) continue;
    if (statSync(path).isDirectory()) { yield* sourceFiles(path); continue; }
    if (!SCAN_EXT.has(extname(entry))) continue;
    if (/^tokens\.generated\./i.test(entry)) continue;

    if (extname(entry) === '.js' && readdirSync(dir).includes(`${entry.slice(0, -3)}.jsx`)) continue;
    yield path;
  }
}

function collect() {

  const byName = new Map();
  for (const layer of ['react', 'angular']) {
    const dir = join(root, 'frameworks', layer);
    for (const path of sourceFiles(dir)) {
      for (const [name, value] of numericConstants(readFileSync(path, 'utf8'))) {
        if (!byName.has(name)) byName.set(name, new Map());
        const layers = byName.get(name);
        if (!layers.has(layer)) layers.set(layer, []);
        layers.get(layer).push({ file: relative(root, path), value });
      }
    }
  }

  const problems = [];
  const hit = new Set();

  for (const [name, layers] of byName) {
    if (layers.size < 2) continue;
    hit.add(name);
    if (EXEMPT.has(name)) continue;
    const where = [...layers].map(([layer, decls]) =>
      decls.map((d) => `${d.file} = ${d.value}`).join(', ')).join('  and  ');
    problems.push(`${name}: declared in both layers — ${where}\n    Author it in contracts/design/ with the script flag instead.`);
  }

  for (const name of EXEMPT.keys()) {
    if (!hit.has(name)) {
      problems.push(`EXEMPT entry "${name}" is stale — it is no longer declared in both layers. Remove it.`);
    }
  }

  return problems;
}

function main() {
  const problems = collect();
  if (problems.length) {
    console.error(`check-duplicate-constants: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  const exempt = EXEMPT.size;
  console.log(
    exempt === 0
      ? 'check-duplicate-constants: no numeric constant is declared in both framework layers'
      : `check-duplicate-constants: no numeric constant is declared in both framework layers except ${exempt} named in EXEMPT with a reason`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
