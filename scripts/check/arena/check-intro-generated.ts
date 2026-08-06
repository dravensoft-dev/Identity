/* The intro/ bundles are tracked, because the git tag serves those pages to a browser and
 * nothing there runs a build. A tracked build product is a promise that it matches its
 * source, and this is what holds the promise: it rebuilds and compares. It also holds the
 * rule that makes the whole arrangement work -- a page's module entry is a bundle, never a
 * source file -- since a page pointing back at its source would serve whatever that source
 * imports, and put scripts/ back out of reach of TypeScript with every gate green.
 * Bundling is Bun-only, so without Bun it reports SKIP on the same terms as check:vendor. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { skipExitCode } from '../../lib/arena/arena-scripts-vars.ts';

function skip(reason) {
  const code = skipExitCode();
  console.error(`check-intro-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; the repository declares ARENA_CHECK_STRICT=1, so this environment overrides it.');
  process.exit(code);
}

export function driftProblems(built: Map<string, string>, dir: string, read = readFileSync) {
  const drift = [];
  for (const [name, expected] of built) {
    let actual;
    try {
      actual = read(join(dir, name), 'utf8');
    } catch {
      drift.push(`intro/${name}: missing — run bun run build:intro`);
      continue;
    }
    if (actual !== expected) drift.push(`intro/${name}: stale — run bun run build:intro`);
  }
  return drift;
}

async function main() {
  if (!process.versions.bun) skip('Bun.build is Bun-only, and this is not running under Bun');

  const { buildIntro, PAGE_DIR } = await import('../../build/arena/build-intro.ts');

  let built;
  try {
    built = await buildIntro({ root });
  } catch (err) {
    console.error(`check-intro-generated: ${(err as Error).message}`);
    process.exit(1);
  }

  const drift = driftProblems(built, join(root, PAGE_DIR));
  if (drift.length) {
    console.error(`check-intro-generated: ${drift.length} page bundle(s) do not match their source\n`);
    for (const d of drift) console.error(`  ${d}`);
    process.exit(1);
  }
  console.log(`check-intro-generated: ${built.size} page bundle(s) in sync`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
