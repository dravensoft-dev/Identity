/* Two steps, because neither tool does the other's job: ngc compiles the templates
 * AOT into ESM that still carries bare @angular/* specifiers and extensionless
 * relative imports, and Bun.build resolves both into something a browser loads.
 * `splitting` keeps the Angular runtime in one shared chunk across every page. */

import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ngcBin } from './check-angular.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'frameworks/angular/tsconfig.demo.json';
const OUT_DIR = join(repoRoot, 'build', 'angular-demo');
const TSC_DIR = join(OUT_DIR, 'tsc');
const JS_DIR = join(OUT_DIR, 'js');
const SRC_ROOT = join(repoRoot, 'frameworks');

export const ENTRY_SUFFIX = '.card.entry.js';

function pruneOrphans(dir) {
  const pruned = [];
  if (!existsSync(dir)) return pruned;
  walk(dir);
  return pruned;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = relative(TSC_DIR, full);
      let srcRel;
      if (rel.endsWith('.js.map')) srcRel = rel.slice(0, -'.js.map'.length) + '.ts';
      else if (rel.endsWith('.d.ts')) srcRel = rel.slice(0, -'.d.ts'.length) + '.ts';
      else if (rel.endsWith('.js')) srcRel = rel.slice(0, -'.js'.length) + '.ts';
      else continue;
      if (!existsSync(join(SRC_ROOT, srcRel))) {
        rmSync(full);
        pruned.push(relative(repoRoot, full));
      }
    }
  }
}

export function collectEntries(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  walk(dir);
  return out.sort();

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name.endsWith(ENTRY_SUFFIX)) out.push(full);
    }
  }
}

export function missingEntryProblems(sourceEntries, emittedEntries) {
  const emitted = new Set(emittedEntries.map((f) => f.slice(0, -'.js'.length)));
  const problems = [];
  for (const src of sourceEntries) {
    const stem = src.slice(0, -'.ts'.length);
    if (!emitted.has(stem)) {
      problems.push(
        `${src} has no corresponding ${ENTRY_SUFFIX} in build/angular-demo/tsc/angular -- `
        + `ngc never compiled it (check tsconfig.demo.json's "include"), so its page loads nothing`,
      );
    }
  }
  return problems;
}

function collectSourceEntries(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  walk(dir);
  return out;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name.endsWith('.card.entry.ts')) out.push(relative(dir, full));
    }
  }
}

async function main() {
  if (typeof Bun === 'undefined' || typeof Bun.build !== 'function') {
    console.error(
      'build-angular-demo: needs Bun.build to bundle the compiled layer for a browser, '
      + 'and this runtime has no bundler. Run it under bun.',
    );
    process.exit(2);
  }

  let bin;
  try {
    bin = ngcBin(repoRoot);
  } catch (err) {
    console.error(`build-angular-demo: ${err.message}`);
    process.exit(1);
  }

  const r = spawnSync(process.execPath, [bin, '-p', join(repoRoot, PROJECT)], { stdio: 'inherit', cwd: repoRoot });
  if (r.error) {
    console.error(`build-angular-demo: ngc failed to spawn: ${r.error.message || r.error}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error('\nbuild-angular-demo: the Angular layer does not compile, so its demo pages cannot be built');
    process.exit(r.status ?? 1);
  }

  const pruned = pruneOrphans(TSC_DIR);
  if (pruned.length > 0) console.log(`build-angular-demo: pruned ${pruned.length} orphaned output file(s)`);

  const emitProblems = missingEntryProblems(
    collectSourceEntries(join(SRC_ROOT, 'angular')),
    collectEntries(join(TSC_DIR, 'angular')).map((p) => relative(join(TSC_DIR, 'angular'), p)),
  );
  if (emitProblems.length > 0) {
    console.error(`\nbuild-angular-demo: ${emitProblems.length} page entr(y/ies) compiled into nothing:\n`);
    for (const p of emitProblems) console.error(`  ${p}`);
    process.exit(1);
  }

  const entrypoints = collectEntries(join(TSC_DIR, 'angular'));
  if (entrypoints.length === 0) {
    console.error(
      'build-angular-demo: found 0 page entries to bundle. An empty result set is a failure, '
      + 'not a clean pass -- every demo page would load a script that was never written.',
    );
    process.exit(1);
  }

  rmSync(JS_DIR, { recursive: true, force: true });
  const built = await Bun.build({ entrypoints, target: 'browser', splitting: true, outdir: JS_DIR, naming: '[name].[ext]' });
  if (!built.success) {
    console.error('\nbuild-angular-demo: bundling failed\n');
    for (const log of built.logs) console.error(String(log));
    process.exit(1);
  }

  console.log(`build-angular-demo: bundled ${entrypoints.length} page(s) into build/angular-demo/js`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
