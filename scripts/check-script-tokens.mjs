/* Asserts the committed frameworks/<layer>/tokens.generated.* are what
 * contracts/design/ generates, that each export agrees with its CSS counterpart, that
 * no token is flagged script-readable without anything importing it, and that
 * `CatSlot` — the one contract type restating a token-derived bound — still
 * matches the ramp it restates.
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

/** Every name imported from a `tokens.generated.*` module in one source file.
 *  Matched case-insensitively on the stem. Both layers spell it `Tokens.generated`
 *  today -- `frameworks/react/Tokens.generated.js` and
 *  `frameworks/angular/Tokens.generated.ts` -- but the match stays
 *  case-insensitive because React's was `tokens.generated.js` until the structure
 *  refactor's batch 3 applied the capital-initial naming rule to it, and a
 *  case-sensitive matcher would have silently stopped finding every React import
 *  the day it was renamed. */
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

/** The one contract type that restates a token-derived bound, checked here and
 *  nowhere else.
 *
 *  `contracts/api/types/cat-slot.json` declares `CatSlot` as the literal set 1..8, and
 *  that 8 is not authored there: it is the count of `--color-cat-*` slots in
 *  `contracts/design/palette.dark.json`, which reaches JS as the derived `catSlots`
 *  export in the modules this gate already builds. `contracts/api/README.md`'s "A closed
 *  set of values is not always an enum" passage permits that copy to exist only
 *  because this assertion ties it back to the palette — add a ninth colour to
 *  the ramp and the contract type must follow or the gate fails.
 *
 *  This is deliberately the single named case and not a mechanism: `CatSlot` is
 *  today the only type in `contracts/api/types/` whose values restate something the token
 *  layer derives, and nothing here generalises to a second one. If a second ever
 *  appears, that is the moment to decide whether a mechanism is worth building —
 *  do not read this as one that already exists.
 *
 *  @param {number} catSlots @param {unknown} values @returns {string[]} */
export function catSlotEnumProblems(catSlots, values) {
  const expected = Array.from({ length: catSlots }, (_, i) => i + 1);
  const actual = Array.isArray(values) ? values : [];
  const matches = actual.length === expected.length && expected.every((v, i) => actual[i] === v);
  if (matches) return [];
  return [`contracts/api/types/cat-slot.json: CatSlot is [${actual.join(', ')}], but the --color-cat-* ramp in contracts/design/palette.dark.json has ${catSlots} slot(s), so it must be [${expected.join(', ')}] — the contract type restates the ramp and has to follow it`];
}

/** An empty contracts/design-generated/ is a failure, and it has to be reported
 *  as ONE problem rather than as the cascade every downstream check produces
 *  when it finds the lookup table empty.
 *
 *  There are two candidate zero counts here, and they fail differently: the
 *  number of .css files the walk below finds, and the number of custom
 *  properties parsed out of them. This guards the FILE count, not the
 *  property count, because the file count is what the walk itself discovers --
 *  the direct analogue of zeroSourceProblems' files.length in check-dtcg.mjs
 *  and zeroPatternProblems' patterns.size in check-behaviour.mjs, both of
 *  which guard what a directory listing returns, not a quantity computed from
 *  parsing what it returns. "Files present but every one of them declares
 *  nothing" is a real, different failure -- but it is a content problem, not a
 *  discovery one, and content is check-tokens-generated.mjs's job: it diffs
 *  every declaration against a fresh build and would name that exact failure
 *  by itself. Measured on 2026-07-29 by moving contracts/design-generated/
 *  aside: 21 lines, one per script-readable token, each reading "exported to
 *  JS but --X is not in any contracts/design-generated/*.css" -- a cascade
 *  naming a consequence 21 times over and the cause never.
 *  @param {number} count @returns {string[]} */
export function zeroGeneratedCssProblems(count) {
  if (count > 0) return [];
  return ['found 0 .css files in contracts/design-generated — an empty result set is a failure, not a clean pass; check the discovery path'];
}

/** Whether the CSS-discovery guard fires, and what to report if it does.
 *
 *  This exists because of a defect a reviewer caught: `main()`'s section 1 (the
 *  drift check against the committed Tokens.generated.*) fills `problems`
 *  BEFORE this guard runs, and the guard used to report and exit on its own
 *  freshly-allocated `zeroCss` array without ever looking at `problems` --
 *  so a run where BOTH section 1's drift and an empty
 *  contracts/design-generated/ were true at once printed only the CSS-discovery
 *  line and silently dropped the real drift finding. Exit code stayed 1, so it
 *  was never a false pass, only lost diagnostic signal -- the same family of
 *  harm the cascade this guard replaces was, just quieter.
 *
 *  The fix merges rather than moving the guard ahead of section 1: moving it
 *  first was the other option on the table, and it is worse, not merely
 *  different -- it would skip section 1 outright whenever the guard fires,
 *  which trades today's loss for the identical shape one section earlier.
 *  Keying the exit on `zeroCss.length` rather than on `existingProblems.length`
 *  matters too: a run where section 1 alone found a stale Tokens.generated.*
 *  and contracts/design-generated/ is otherwise fine must still fall through to
 *  sections 3 and 4 exactly as it always has, not stop early on a finding this
 *  guard had nothing to do with.
 *  @param {string[]} existingProblems @param {number} cssFileCount
 *  @returns {string[]} empty when the guard does not fire and main() should
 *  continue; otherwise existingProblems plus the CSS-discovery finding,
 *  ready to report and exit on. */
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

  /* 2. Parity against the CSS. Reads only contracts/design-generated/, where
   * it used to read tokens/ and pick up colors.css alongside the generated
   * four -- harmless, because a script-readable token is emitted by
   * build-tokens.mjs into one of the generated files, never into the
   * hand-authored colors.css. */
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

  /* Both names come from the source, never from re-deriving one out of the
   * other: scriptName('sp-4') is 'sp4', and no camel-to-kebab rule recovers
   * 'sp-4' from that, because there is no case change to split on. */
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

  /* 4. The one contract type that restates a token-derived bound. See
   * catSlotEnumProblems above for why this lives in this gate. The count is
   * read from the freshly built module rather than the committed one, so this
   * is an assertion against contracts/design/ even when step 1 is already
   * failing. */
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
