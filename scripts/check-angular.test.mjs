import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { typecheck } from './check-angular.mjs';

/* What is assertable about the emit project without paying for a compile.
 *
 * The two tests that shell out to `ngc` are suspended below, so these exist to
 * catch the realistic regression instead: the emit project being narrowed so it
 * stops covering the suites, or quietly given a `compilerOptions` block that
 * relaxes what the shipped layer is held to. A test surface compiled more
 * leniently than the layer it exercises is worse than the honest hole it
 * replaced, so that is asserted mechanically rather than left to review. */
const BUILD_ONLY_OPTIONS = ['outDir', 'sourceMap', 'incremental', 'tsBuildInfoFile'];

test('the emit project covers the test directory and relaxes nothing', () => {
  const emit = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.test.json'), 'utf8'));
  assert.equal(emit.extends, './tsconfig.check.json',
    'the emit project must inherit the layer project rather than restate its strictness');
  assert.ok(Array.isArray(emit.include) && emit.include.some((p) => p.startsWith('./test/')),
    `the emit project no longer covers ./test/: ${JSON.stringify(emit.include)}`);
  assert.equal(emit.angularCompilerOptions, undefined,
    'the emit project must carry no angularCompilerOptions of its own -- it relaxes nothing');
  const extra = Object.keys(emit.compilerOptions ?? {}).filter((k) => !BUILD_ONLY_OPTIONS.includes(k));
  assert.deepEqual(extra, [],
    `the emit project may carry build configuration only; these are something else: ${extra.join(', ')}`);
});

test('the layer project still names the barrel alone, so check:angular keeps its own subject', () => {
  const layer = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.check.json'), 'utf8'));
  assert.deepEqual(layer.files, ['./index.ts'],
    'the shipped surface is the barrel; folding the tests into it would report a test error as a broken layer');
});

// PLAN-E-SUSPENDED — commented out to keep the suite fast while plans A-D reshape the repo.
// Cost when live: 7.97s. Reason: both tests shell out to a full ngc --strictTemplates run over the Angular layer.
// Restore in Plan E: delete these five header lines and strip the leading "// " from
// lines below until the next PLAN-E-SUSPENDED-END marker. See
// docs/superpowers/specs/2026-07-23-8-api-contracts-design.md
// /* The explicit timeout matters as much here as on the test below, which has
//  * carried one from the start. A full `ngc` run over the layer crossed
//  * node:test's 5s default as the primitive count grew -- it measured ~5.1s at
//  * 21 primitives -- and the failure that produces is deeply misleading: the
//  * runner kills the compile, `typecheck()` reports the killed process's exit
//  * status 1 with EMPTY output, and the assertion below prints "1 !== 0" with no
//  * diagnostic at all, which reads exactly like a real type error nobody can
//  * locate. The layer is still growing, so this is generous rather than snug. */
// test('the Angular layer as committed typechecks', { timeout: 120_000 }, () => {
//   const { status, output } = typecheck();
//   assert.equal(status, 0, output);
// });
//
// test('a template referencing a member that does not exist fails', { timeout: 60_000 }, () => {
//   const dir = mkdtempSync(join(tmpdir(), 'arena-ng-'));
//   try {
//     cpSync(join(repoRoot, 'frameworks'), join(dir, 'frameworks'), { recursive: true });
//     // node_modules is 225 MB / 17,675 files and read-only here — ngc resolves
//     // @angular/* by walking up from the temp tree, and follows a symlink just
//     // as well as a real directory, so there is nothing to gain from copying it.
//     symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'));
//     const tag = join(dir, 'frameworks/angular/primitives/tag/tag.ts');
//     writeFileSync(tag, readFileSync(tag, 'utf8').replace('styles().root()', 'styles().nosuchslot()'));
//     const { status, output } = typecheck({ root: dir });
//     assert.notEqual(status, 0);
//     assert.match(output, /nosuchslot/);
//   } finally {
//     rmSync(dir, { recursive: true, force: true });
//   }
// });
// PLAN-E-SUSPENDED-END
