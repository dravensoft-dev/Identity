/** Emit frameworks/angular's test surface with ngc.
 *
 *  This is a BUILD, not a gate, and the distinction is the point of the batch it
 *  arrived in. `check:angular` compiles `./index.ts` -- the shipped surface -- and
 *  says whether the layer typechecks. This compiles the test surface and produces
 *  the JavaScript the suites actually run, so a type error here does not merely
 *  fail an assertion somewhere: the tests cannot run at all. That guarantee comes
 *  from being a build the test run depends on rather than a separate check run
 *  beside it -- a failed emit already stops the suites, so nothing would be left
 *  for a gate to additionally report.
 *
 *  It also makes the templates real. Under `@angular/compiler`'s JIT a signal input
 *  cannot be driven through a template binding, which is what forced this
 *  directory's bypass convention and left fourteen inline templates that were not
 *  valid Angular. Compiled by ngtsc they are, and strictTemplates covers them.
 *
 *  `incremental: true` means `ngc` never deletes output for a source that stopped
 *  existing -- a deleted or renamed suite leaves its old `.js` behind, and `bun
 *  test` keeps discovering and keeps reporting it as passing against a source file
 *  that is gone. So every successful emit is followed by `pruneOrphans()`, which
 *  walks the emitted tree and deletes any `.js`/`.js.map`/`.d.ts` whose source no
 *  longer exists, and prints what it removed rather than doing it silently. This
 *  is `check:demos`' "drift and orphaned output" idiom applied to this emit.
 *  `.tsbuildinfo` is never a candidate -- it holds `outDir`'s incremental state,
 *  and blanket-deleting the output tree instead (the alternative to pruning) would
 *  either destroy that state, making `incremental` a lie, or, if the buildinfo
 *  were preserved separately, leave `ngc` believing the deleted sources' output is
 *  still up to date and emit nothing for them. */
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ngcBin } from './check-angular.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'frameworks/angular/tsconfig.test.json';
const OUT_DIR = join(repoRoot, 'build', 'angular-test');
// tsconfig.test.json's rootDir is ".." relative to frameworks/angular/ (where that
// tsconfig lives), i.e. frameworks/ itself -- so the emitted tree under OUT_DIR
// mirrors frameworks/<path> path-for-path, and this is the anchor pruneOrphans()
// maps an emitted file's path back to the source it was compiled from.
const SRC_ROOT = join(repoRoot, 'frameworks');

/** Delete every emitted `.js`, `.js.map` or `.d.ts` under `dir` whose corresponding
 *  `.ts` source no longer exists under SRC_ROOT. See the module header for why this
 *  runs after every successful emit rather than never, and why it prunes file by
 *  file rather than clearing `dir` first.
 *  @param {string} dir @returns {string[]} repo-relative paths of everything pruned */
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
      else continue; // .tsbuildinfo or anything else -- never a candidate
      if (!existsSync(join(SRC_ROOT, srcRel))) {
        rmSync(full);
        pruned.push(relative(repoRoot, full));
      }
    }
  }
}

/** Every `.test.ts` under `dir`, repo-relative to `dir` itself.
 *  @param {string} dir @returns {string[]} e.g. ["DataVisuals.test.ts", "components/charts/bar-chart/BarChart.geometry.test.ts"] */
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

/** Every emitted `.test.js` under `dir`, repo-relative to `dir` itself.
 *  @param {string} dir @returns {string[]} */
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

/** Every source `.test.ts` must have a matching emitted `.test.js`, or the suite
 *  compiled into nothing and `bun test build/angular-test/angular` never sees it
 *  -- a suite that is silently ABSENT rather than one that fails. This is the
 *  exact shape CLAUDE.md's Known debt opens with: "a green run is only as good
 *  as what the gate looked at, and a gate that finds nothing reports zero
 *  violations either way." `tsconfig.test.json`'s `include` is the one thing
 *  that can produce this: a `.test.ts` that no included path reaches (or that
 *  nothing importable transitively pulls in) is never handed to `ngc` at all,
 *  and an incremental, non-failing compile has no way to say so on its own --
 *  it compiled everything it was given, correctly.
 *
 *  Both lists are repo-relative to the SAME root by construction --
 *  `collectTestSources(frameworks/angular)` and
 *  `collectEmittedTests(build/angular-test/angular)` -- so a `.test.ts` stem and
 *  its `.test.js` sibling are byte-identical once each list's own extension is
 *  stripped, and no path-shape guessing is needed to compare them.
 *  @param {string[]} sourceTests @param {string[]} emittedTests
 *  @returns {string[]} one message per source suite missing from the emit */
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
