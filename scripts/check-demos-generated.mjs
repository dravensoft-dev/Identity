/* Asserts every committed .js sibling under frameworks/react/components/ and
 * frameworks/react/ui_kits/console/ — every .js with a .jsx of the same name
 * next to it — is what build-demos.mjs produces from that sibling right now,
 * and that no such .js is left behind after its .jsx sibling is gone.
 *
 * Same contract as check-vendor-generated.mjs and check-tailwind-
 * generated.mjs: build output lives in the tree (a demo page's <script
 * type="module"> loads it directly, with no build step at serve time), so it
 * is only trustworthy while something fails the moment it goes stale.
 *
 * Also not runtime-portable, and for the same reason check-vendor-
 * generated.mjs gives for itself: it calls Bun.Transpiler, which only exists
 * under Bun. Skips with exit 2 when not running under Bun, mapped to SKIP by
 * check-all.mjs and promoted to a hard failure by ARENA_CHECK_STRICT=1 or
 * CI=true. `bun run check` always runs this under Bun, since check-all spawns
 * every gate as `process.execPath <file>`.
 *
 *   bun scripts/check-demos-generated.mjs   -> exit 0 if in sync
 *                                              1 on drift (or strict skip)
 *                                              2 could not run here (not Bun)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { buildDemos, BANNER, ROOTS } from './build-demos.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Same skip contract as check-vendor-generated.mjs's skipExitCode, not
 *  shared for the same reason that one gives: two gates missing unrelated
 *  dependencies (a browser vs. a JS runtime) have nothing else in common to
 *  justify a shared module.
 *  @param {Record<string, string|undefined>} env @returns {1 | 2} */
export function skipExitCode(env = process.env) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}

function skip(reason) {
  const code = skipExitCode(process.env);
  console.error(`check-demos-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; set ARENA_CHECK_STRICT=1 to make this a failure.');
  process.exit(code);
}

/** @param {string} dir @returns {string[]} absolute paths of every *.js
 *  under dir, recursive. */
function findJsFiles(dir) {
  const found = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const path = join(d, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.js')) found.push(path);
    }
  };
  walk(dir);
  return found;
}

async function main() {
  if (!process.versions.bun) skip('Bun.Transpiler is Bun-only, and this is not running under Bun');

  const built = await buildDemos({ root });
  const drift = [];

  for (const [outRel, expected] of built) {
    const path = join(root, outRel);
    let actual;
    try {
      actual = readFileSync(path, 'utf8');
    } catch {
      drift.push(`${outRel}: missing — run bun run build:demos`);
      continue;
    }
    if (actual !== expected) drift.push(`${outRel}: stale`);
  }

  // An orphan: a *.js this build did not just write, but that carries this
  // script's own BANNER — so it was generated once, from a *.jsx that has
  // since been renamed or deleted, and never cleaned up. The BANNER check is
  // what tells that apart from a hand-authored plain-JS helper in the same
  // tree (chart-internals.js, calendar-internals.js) that never had a *.jsx
  // counterpart and is not this gate's to own. Left behind, an orphan would
  // sit there silently — a stale compiled module a page might still load —
  // and nothing would ever flag it as wrong.
  for (const treeRoot of ROOTS) {
    for (const absPath of findJsFiles(join(root, treeRoot))) {
      const outRel = relative(root, absPath).split(sep).join('/');
      if (built.has(outRel)) continue;
      let content;
      try {
        content = readFileSync(absPath, 'utf8');
      } catch {
        continue; // raced with something else deleting it; not this gate's problem to report
      }
      if (content.startsWith(BANNER)) drift.push(`${outRel}: orphaned — no .jsx sibling produces it anymore; remove it or run bun run build:demos`);
    }
  }

  if (drift.length) {
    console.error(`check-demos-generated: ${drift.length} drift(s) between a *.jsx source and its committed *.js sibling\n`);
    for (const d of drift) console.error(`  ${d}`);
    console.error('\nRun: bun run build:demos');
    process.exit(1);
  }
  console.log(`check-demos-generated: ${built.size} file(s) in sync`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
