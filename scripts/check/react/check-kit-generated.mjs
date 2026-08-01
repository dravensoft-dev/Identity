/* The kit is tracked, so it is the one build product a stale commit ships to a consumer
 * verbatim. This compares it against a fresh build in a temporary directory rather than
 * rebuilding in place, so a failing run never leaves the working tree half-written. */

import { readFileSync, existsSync, mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { assembleModules } from '../../build/react/build-react-package.mjs';
import { KIT } from '../../build/react/build-kit.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

export function skipExitCode(env = process.env) {
  return env.ARENA_CHECK_STRICT === '1' || env.CI === 'true' ? 1 : 2;
}

function skip(reason) {
  const code = skipExitCode(process.env);
  console.error(`check-kit-generated: ${code === 1 ? 'FAILED (strict)' : 'SKIPPED'} — ${reason}`);
  if (code === 2) console.error('  check-all reports the run INCOMPLETE; set ARENA_CHECK_STRICT=1 to make this a failure.');
  process.exit(code);
}

export function filesUnder(dir, found = [], base = dir) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { filesUnder(p, found, base); continue; }
    found.push(relative(base, p).split(sep).join('/'));
  }
  return found;
}

export function drift(committed, fresh) {
  const problems = [];
  const freshNames = new Set(filesUnder(fresh));
  for (const rel of freshNames) {
    const at = join(committed, rel);
    if (!existsSync(at)) { problems.push(`${rel}: missing — run bun run build:kit`); continue; }
    if (readFileSync(at, 'utf8') !== readFileSync(join(fresh, rel), 'utf8')) problems.push(`${rel}: stale`);
  }
  for (const rel of filesUnder(committed))
    if (!freshNames.has(rel)) problems.push(`${rel}: orphaned — no source produces it anymore`);
  return problems;
}

export function zeroKitProblems(count) {
  if (count > 0) return [];
  return ['a fresh build wrote 0 files; an empty kit ships a copy-in channel with nothing in it'];
}

function main() {
  if (!process.versions.bun) skip('Bun.Transpiler is Bun-only, and this is not running under Bun');

  const fresh = mkdtempSync(join(tmpdir(), 'arena-kit-'));
  try {
    const { compiled } = assembleModules(root, fresh, { infix: '.generated' });
    const empty = zeroKitProblems(compiled.length);
    const problems = [...empty, ...drift(join(root, KIT), fresh)];
    if (problems.length) {
      console.error(`check-kit-generated: ${problems.length} drift(s) between the layer and the tracked kit\n`);
      for (const p of problems) console.error(`  ${p}`);
      console.error('\nRun: bun run build:kit');
      process.exit(1);
    }
    console.log(`check-kit-generated: ${filesUnder(fresh).length} file(s) in sync`);
  } finally {
    rmSync(fresh, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
