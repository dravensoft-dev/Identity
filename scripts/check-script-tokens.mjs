/* Asserts the committed frameworks/<layer>/tokens.generated.* are what
 * tokens/src/ generates, that each export agrees with its CSS counterpart, and
 * that no token is flagged script-readable without anything importing it.
 *
 * The generated modules are committed (the plugin is served from the release
 * tag and the copy-in kit reads them directly), so a stale committed file is a
 * silent failure. This is the guard, and it is the JS-side twin of
 * check-tokens-generated.mjs.
 *
 *   bun scripts/check-script-tokens.mjs   -> exit 0 if in sync, 1 on drift
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { buildScriptModules, collectScriptTokens, SCRIPT_TARGETS } from './build-tokens.mjs';
import { parseDecls } from './lib/css-decls.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The CSS half of a script-readable token is always a bare number with at most
 *  a px/ms unit — that is what serialize-token.mjs renders for the three
 *  flaggable types. Anything else means the token is not script-readable and
 *  the flag is wrong. */
export function cssCounterpart(value) {
  const m = /^(-?\d+(?:\.\d+)?)(px|ms)?$/.exec(value.trim());
  return m ? Number(m[1]) : null;
}

/** Every name imported from a `tokens.generated.*` module in one source file. */
export function importedNames(source) {
  const names = new Set();
  const re = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*tokens\.generated(?:\.js|\.ts)?['"]/g;
  for (const m of source.matchAll(re)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.add(name);
    }
  }
  return names;
}

const SCAN_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'vendor') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) { yield* sourceFiles(path); continue; }
    if (!SCAN_EXT.has(extname(entry))) continue;
    if (entry.startsWith('tokens.generated.')) continue;
    yield path;
  }
}

/* The assertions run only when this file is executed directly, not when it is
 * imported — check-script-tokens.test.mjs imports cssCounterpart and
 * importedNames to unit-test them in isolation, and importing must not also
 * run the full scan (and, on a real problem, process.exit). Same idiom as
 * check-arbitrary-values.mjs and check-dimension-literals.mjs, the other two
 * gates with a paired test file that imports their exported helpers. */
async function main() {
  const problems = [];

  /* 1. Drift. */
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

  /* 2. Parity against the CSS. */
  const cssValues = new Map();
  for (const file of readdirSync(join(root, 'tokens'))) {
    if (extname(file) !== '.css') continue;
    for (const [, decls] of parseDecls(readFileSync(join(root, 'tokens', file), 'utf8'))) {
      for (const [prop, value] of decls) if (!cssValues.has(prop)) cssValues.set(prop, value);
    }
  }

  /* Both names come from the source, never from re-deriving one out of the
   * other: scriptName('sp-4') is 'sp4', and no camel-to-kebab rule recovers
   * 'sp-4' from that, because there is no case change to split on. */
  const flagged = await collectScriptTokens();

  for (const { cssName, jsName, value } of flagged) {
    if (!cssValues.has(cssName)) {
      problems.push(`${jsName}: exported to JS but --${cssName} is not in any tokens/*.css`);
      continue;
    }
    const css = cssCounterpart(cssValues.get(cssName));
    if (css === null) {
      problems.push(`${jsName}: --${cssName} is "${cssValues.get(cssName)}", which is not a bare number — the script flag is wrong`);
    } else if (css !== value) {
      problems.push(`${jsName}: JS has ${value}, --${cssName} has ${css}`);
    }
  }

  /* 3. No orphan flags. */
  const imported = new Set();
  for (const path of sourceFiles(join(root, 'frameworks'))) {
    for (const name of importedNames(readFileSync(path, 'utf8'))) imported.add(name);
  }
  for (const { jsName } of flagged) {
    if (!imported.has(jsName)) {
      problems.push(`${jsName}: flagged script-readable but no framework layer imports it — remove the flag or use the token`);
    }
  }

  if (problems.length) {
    console.error(`check-script-tokens: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-script-tokens: ${flagged.length} script-readable token(s) in sync across ${SCRIPT_TARGETS.length} layer(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
