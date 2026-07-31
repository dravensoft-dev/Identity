import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ngcBin } from './check-angular.mjs';
import { repoRoot } from './lib/repo-root.mjs';

const PROJECT = 'frameworks/angular/tsconfig.test.json';
const OUT_DIR = join(repoRoot, 'build', 'angular-test');

const SRC_ROOT = join(repoRoot, 'frameworks');

function pruneOrphans(dir) {
  const pruned = [];
  walk(dir);
  return pruned;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = relative(OUT_DIR, full);
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

function collectTestSources(dir) {
  const out = [];
  walk(dir);
  return out;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name.endsWith('.test.ts')) out.push(relative(dir, full));
    }
  }
}

function collectEmittedTests(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  walk(dir);
  return out;

  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (entry.name.endsWith('.test.js')) out.push(relative(dir, full));
    }
  }
}

export function missingEmitProblems(sourceTests, emittedTests) {
  const emittedStems = new Set(emittedTests.map((f) => f.slice(0, -'.js'.length)));
  const problems = [];
  for (const src of sourceTests) {
    const stem = src.slice(0, -'.ts'.length);
    if (!emittedStems.has(stem)) {
      problems.push(
        `${src} has no corresponding .test.js in build/angular-test/angular -- ` +
        `ngc never compiled it (check tsconfig.test.json's "include"), so this suite never runs`,
      );
    }
  }
  return problems;
}

function main() {
  let bin;
  try {
    bin = ngcBin(repoRoot);
  } catch (err) {
    console.error(`build-angular-tests: ${err.message}`);
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [bin, '-p', join(repoRoot, PROJECT)], { stdio: 'inherit', cwd: repoRoot });
  if (r.error) {
    console.error(`build-angular-tests: ngc failed to spawn: ${r.error.message || r.error}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error('\nbuild-angular-tests: the Angular test surface does not compile, so its suites cannot run');
    process.exit(r.status ?? 1);
  }
  console.log('build-angular-tests: the Angular test surface compiled to build/angular-test');
  const pruned = pruneOrphans(OUT_DIR);
  if (pruned.length > 0) {
    console.log(`build-angular-tests: pruned ${pruned.length} orphaned output file(s):`);
    for (const p of pruned) console.log(`  ${p}`);
  } else {
    console.log('build-angular-tests: no orphaned output to prune');
  }

  const emitProblems = missingEmitProblems(
    collectTestSources(join(SRC_ROOT, 'angular')),
    collectEmittedTests(join(OUT_DIR, 'angular')),
  );
  if (emitProblems.length > 0) {
    console.error(`\nbuild-angular-tests: ${emitProblems.length} suite(s) compiled into nothing:\n`);
    for (const p of emitProblems) console.error(`  ${p}`);
    console.error('');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
