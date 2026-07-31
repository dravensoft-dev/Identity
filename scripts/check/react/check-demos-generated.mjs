import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { buildDemos, BANNER, ROOTS } from '../../build/react/build-demos.mjs';
import { repoRoot as root } from '../../lib/repo-root.mjs';

export function skipExitCode(env = process.env) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}

function skip(reason) {
  const code = skipExitCode(process.env);
  console.error(`check-demos-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; set ARENA_CHECK_STRICT=1 to make this a failure.');
  process.exit(code);
}

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

  for (const treeRoot of ROOTS) {
    for (const absPath of findJsFiles(join(root, treeRoot))) {
      const outRel = relative(root, absPath).split(sep).join('/');
      if (built.has(outRel)) continue;
      let content;
      try {
        content = readFileSync(absPath, 'utf8');
      } catch {
        continue;
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
