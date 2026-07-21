/* Asserts the committed frameworks/react/vendor/*.js are what build-vendor.mjs
 * produces from the pinned react/react-dom versions right now.
 *
 * The bundles are committed (see build-vendor.mjs's banner for why: the demo
 * pages and check:cards need them on a fresh clone with no extra step), so a
 * stale committed bundle is the same silent-failure shape check-tokens-
 * generated.mjs and check-tailwind-generated.mjs guard against — this is
 * that guard for the vendor layer.
 *
 * Unlike those two, the build this compares against is not runtime-portable:
 * it calls Bun.build(), which only exists under Bun. Every other gate in
 * GATES runs identically under `bun scripts/check-all.mjs` and `node
 * scripts/check-all.mjs` — this is the second exception (the first is
 * check-card-viewports.mjs, which needs a browser it cannot assume is
 * there). Both take the same shape: skip with exit 2 when the dependency is
 * absent, mapped to SKIP by check-all and promoted to a hard failure by
 * ARENA_CHECK_STRICT=1 or CI=true, so an automated run never mistakes an
 * unmet dependency for a clean tree. Since check-all spawns every gate as
 * `process.execPath <file>`, `bun run check` — the path that matters — runs
 * this under Bun and never hits the skip at all.
 *
 *   bun scripts/check-vendor-generated.mjs   -> exit 0 if in sync
 *                                               1 on drift (or strict skip)
 *                                               2 could not run here (not Bun)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The exit code for "this gate cannot run here" — same contract as
 *  check-card-viewports.mjs's skipExitCode, duplicated rather than shared
 *  because the two gates are missing unrelated dependencies (a browser vs.
 *  a JS runtime) and have nothing else in common to justify a shared module.
 *  @param {Record<string, string|undefined>} env @returns {1 | 2} */
export function skipExitCode(env = process.env) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}

function skip(reason) {
  const code = skipExitCode(process.env);
  console.error(`check-vendor-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; set ARENA_CHECK_STRICT=1 to make this a failure.');
  process.exit(code);
}

async function main() {
  if (!process.versions.bun) skip('Bun.build is Bun-only, and this is not running under Bun');

  const { buildVendor } = await import('./build-vendor.mjs');
  const built = await buildVendor({ root });
  const drift = [];

  for (const [name, expected] of built) {
    const path = join(root, 'frameworks/react/vendor', name);
    let actual;
    try {
      actual = readFileSync(path, 'utf8');
    } catch {
      drift.push(`frameworks/react/vendor/${name}: missing — run bun run build:vendor`);
      continue;
    }
    if (actual !== expected) drift.push(`frameworks/react/vendor/${name}: stale`);
  }

  if (drift.length) {
    console.error(`check-vendor-generated: ${drift.length} drift(s) between package.json's pinned versions and the committed bundle(s)\n`);
    for (const d of drift) console.error(`  ${d}`);
    console.error('\nRun: bun run build:vendor');
    process.exit(1);
  }
  console.log(`check-vendor-generated: ${built.size} file(s) in sync`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
