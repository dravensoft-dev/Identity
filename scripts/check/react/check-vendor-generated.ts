import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { skipExitCode } from '../../lib/arena/arena-scripts-vars.mjs';

function skip(reason) {
  const code = skipExitCode();
  console.error(`check-vendor-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; the repository declares ARENA_CHECK_STRICT=1, so this environment overrides it.');
  process.exit(code);
}

async function main() {
  if (!process.versions.bun) skip('Bun.build is Bun-only, and this is not running under Bun');

  const { buildVendor } = await import('../../build/react/build-vendor.ts');
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
