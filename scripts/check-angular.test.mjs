import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { PROJECTS, typecheck } from './check-angular.mjs';

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
  assert.ok((emit.exclude ?? []).includes('./components/**/*.card.entry.ts'),
    'a page entry bootstraps an application at module scope, so emitting it into the test tree '
    + 'would put a running app beside the suites that share one document');
});

test('the demo project reaches the page entries and relaxes nothing either', () => {
  const demo = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.demo.json'), 'utf8'));
  assert.equal(demo.extends, './tsconfig.check.json',
    'the demo project must inherit the layer project rather than restate its strictness');
  assert.equal(demo.angularCompilerOptions, undefined,
    'the demo project must carry no angularCompilerOptions of its own -- it relaxes nothing');
  const extra = Object.keys(demo.compilerOptions ?? {}).filter((k) => !BUILD_ONLY_OPTIONS.includes(k));
  assert.deepEqual(extra, [],
    `the demo project may carry build configuration only; these are something else: ${extra.join(', ')}`);
  assert.ok((demo.exclude ?? []).includes('./**/*.test.ts'),
    'the demo bundle must not carry the suites — they import node:test, which the layer has no types for');
});

test('check:angular typechecks both projects, because no barrel reaches a page entry', () => {
  assert.deepEqual(
    PROJECTS.map((p) => p.project),
    ['frameworks/angular/tsconfig.check.json', 'frameworks/angular/tsconfig.demo.json'],
  );
});

test('the layer project still names the barrel alone, so check:angular keeps its own subject', () => {
  const layer = JSON.parse(readFileSync(join(repoRoot, 'frameworks/angular/tsconfig.check.json'), 'utf8'));
  assert.deepEqual(layer.files, ['./index.ts'],
    'the shipped surface is the barrel; folding the tests into it would report a test error as a broken layer');
});
