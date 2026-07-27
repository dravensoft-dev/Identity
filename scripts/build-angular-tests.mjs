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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
