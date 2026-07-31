import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';
import { buildScriptModules, collectScriptTokens, SCRIPT_TARGETS } from './build-tokens.mjs';
import { parseDecls } from './lib/css-decls.mjs';
import { repoRoot as root } from './lib/repo-root.mjs';

export function cssCounterpart(value) {
  const m = /^(-?\d+(?:\.\d+)?)(px|ms)?$/.exec(value.trim());
  return m ? Number(m[1]) : null;
}

export function importedNames(source) {
  const names = new Set();
  const re = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*tokens\.generated(?:\.js|\.ts)?['"]/gi;
  for (const m of source.matchAll(re)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.add(name);
    }
  }
  return names;
}

export function catSlotEnumProblems(catSlots, values) {
  const expected = Array.from({ length: catSlots }, (_, i) => i + 1);
  const actual = Array.isArray(values) ? values : [];
  const matches = actual.length === expected.length && expected.every((v, i) => actual[i] === v);
  if (matches) return [];
  return [`contracts/api/types/cat-slot.json: CatSlot is [${actual.join(', ')}], but the --color-cat-* ramp in contracts/design/palette.dark.json has ${catSlots} slot(s), so it must be [${expected.join(', ')}] — the contract type restates the ramp and has to follow it`];
}

export function zeroGeneratedCssProblems(count) {
  if (count > 0) return [];
  return ['found 0 .css files in contracts/design-generated — an empty result set is a failure, not a clean pass; check the discovery path'];
}

export function cssDiscoveryProblems(existingProblems, cssFileCount) {
  const zeroCss = zeroGeneratedCssProblems(cssFileCount);
  return zeroCss.length ? [...existingProblems, ...zeroCss] : [];
}

const SCAN_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'vendor') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) { yield* sourceFiles(path); continue; }
    if (!SCAN_EXT.has(extname(entry))) continue;
    if (/^tokens\.generated\./i.test(entry)) continue;
    yield path;
  }
}

async function main() {
  const problems = [];

  const built = await buildScriptModules();
  for (const [path, expected] of built) {
    let actual;
    try {
      actual = readFileSync(join(root, path), 'utf8');
    } catch {
      problems.push(`${path}: missing — run bun run build:tokens`);
      continue;
    }
    if (actual !== expected) problems.push(`${path}: stale — run bun run build:tokens`);
  }

  const cssFiles = readdirSync(join(root, 'contracts', 'design-generated')).filter((f) => extname(f) === '.css');
  const gated = cssDiscoveryProblems(problems, cssFiles.length);
  if (gated.length) {
    console.error(`check-script-tokens: ${gated.length} problem(s)\n`);
    for (const g of gated) console.error(`  ${g}`);
    process.exit(1);
  }
  const cssValues = new Map();
  for (const file of cssFiles) {
    for (const [, decls] of parseDecls(readFileSync(join(root, 'contracts', 'design-generated', file), 'utf8'))) {
      for (const [prop, value] of decls) if (!cssValues.has(prop)) cssValues.set(prop, value);
    }
  }

  const flagged = await collectScriptTokens();

  for (const { cssName, jsName, value } of flagged) {
    if (!cssValues.has(cssName)) {
      problems.push(`${jsName}: exported to JS but --${cssName} is not in any contracts/design-generated/*.css`);
      continue;
    }
    const css = cssCounterpart(cssValues.get(cssName));
    if (css === null) {
      problems.push(`${jsName}: --${cssName} is "${cssValues.get(cssName)}", which is not a bare number — the script flag is wrong`);
    } else if (css !== value) {
      problems.push(`${jsName}: JS has ${value}, --${cssName} has ${css}`);
    }
  }

  const imported = new Set();
  for (const path of sourceFiles(join(root, 'frameworks'))) {
    for (const name of importedNames(readFileSync(path, 'utf8'))) imported.add(name);
  }
  for (const { jsName } of flagged) {
    if (!imported.has(jsName)) {
      problems.push(`${jsName}: flagged script-readable but no framework layer imports it — remove the flag or use the token`);
    }
  }

  const [, freshModule] = built.entries().next().value;
  const catSlots = Number(/^export const catSlots = (\d+);$/m.exec(freshModule)?.[1]);
  if (!Number.isInteger(catSlots)) {
    problems.push('catSlots: the generated module no longer exports a numeric catSlots — CatSlot cannot be checked against the ramp');
  } else {
    try {
      const catSlot = JSON.parse(readFileSync(join(root, 'contracts/api/types/cat-slot.json'), 'utf8'));
      problems.push(...catSlotEnumProblems(catSlots, catSlot.values));
    } catch (err) {
      problems.push(`contracts/api/types/cat-slot.json: unreadable (${err.message}) — CatSlot restates the --color-cat-* ramp and must exist`);
    }
  }

  if (problems.length) {
    console.error(`check-script-tokens: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-script-tokens: ${flagged.length} script-readable token(s) in sync across ${SCRIPT_TARGETS.length} layer(s); CatSlot matches the ${catSlots}-slot ramp`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
