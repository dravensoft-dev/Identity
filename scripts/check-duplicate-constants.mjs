/* Fails when the same named numeric constant is declared in BOTH framework
 * layers, which is how chart geometry drifted before the script-readable token
 * target existed: CAT_SLOTS, CHART_HEIGHT and PAD were declared identically in
 * frameworks/react/components/charts/chart-internals.js and
 * frameworks/angular/primitives/chart-internals.ts, and W and EDGE in the two
 * Onboarding implementations. All five would have failed here the day the
 * second one was written.
 *
 * WHAT THIS DOES NOT CATCH, stated so nobody reads it as more than it is: a
 * design value declared in ONE layer only. Deciding whether a bare number in a
 * JS object is a design value needs judgement no scanner has -- a number in an
 * object is not a dimension until something uses it as one, which is exactly
 * why check-dimension-literals.mjs cannot reach these. This gate takes the
 * decidable half: cross-layer duplication, no judgement call, near-zero false
 * positives.
 *
 *   bun scripts/check-duplicate-constants.mjs   -> exit 0 if clean, 1 on duplication
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* A constant that is legitimately the same in both layers because it is the
 * same external fact, not an Arena design decision. Each entry carries a
 * reason, and a stale entry -- one naming a constant no longer duplicated --
 * fails this gate, the same invariant check-dimension-literals.mjs's EXEMPT
 * holds. */
const EXEMPT = new Map([
  // (empty today; add with a reason when a genuine shared constant appears)
]);

/** Module-level `const NAME = <number>` and `const NAME = { k: <number>, ... }`.
 *  Deliberately only module level: a constant inside a function body is local
 *  reasoning, not a shared value, and Onboarding's own W/EDGE lived in a
 *  function before this plan moved them out. */
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

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'vendor') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) { yield* sourceFiles(path); continue; }
    if (!SCAN_EXT.has(extname(entry))) continue;
    if (entry.startsWith('tokens.generated.')) continue;
    // A compiled .js sibling restates its .jsx source; scanning both would
    // report every constant as duplicated with itself.
    if (extname(entry) === '.js' && readdirSync(dir).includes(`${entry.slice(0, -3)}.jsx`)) continue;
    yield path;
  }
}

function collect() {
  /** name -> layer -> [{ file, value }] */
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
    problems.push(`${name}: declared in both layers — ${where}\n    Author it in tokens/src/ with the script flag instead.`);
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
  console.log('check-duplicate-constants: no numeric constant is declared in both framework layers');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
