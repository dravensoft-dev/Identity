import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { numericConstants, sourceFiles } from './check-duplicate-constants.mjs';

test('finds a module-level numeric const', () => {
  assert.deepEqual(numericConstants('export const ARENA_CHART_HEIGHT = 280;'), new Map([['ARENA_CHART_HEIGHT', '280']]));
});

test('finds a const that is not exported', () => {
  assert.deepEqual(numericConstants('const HOUR_H = 44;'), new Map([['HOUR_H', '44']]));
});

test('finds a flat numeric object and normalises its whitespace', () => {
  assert.deepEqual(
    numericConstants('export const ARENA_PAD = { t: 8, r: 8, b: 28, l: 44 };'),
    new Map([['ARENA_PAD', '{t:8,r:8,b:28,l:44}']]),
  );
});

test('reads through an as const suffix', () => {
  assert.deepEqual(
    numericConstants('export const ARENA_PAD = { t: 8 } as const;'),
    new Map([['ARENA_PAD', '{t:8}']]),
  );
});

test('ignores a const initialised from an identifier', () => {
  assert.deepEqual(numericConstants('export const ARENA_CHART_HEIGHT = chartHeight;'), new Map());
});

test('ignores a string const', () => {
  assert.deepEqual(numericConstants("const GUTTER = 'calc(var(--sp-1) * 14)';"), new Map());
});

test('ignores a const declared inside a function body', () => {
  const src = 'function f() {\n  const W = 320;\n}';
  assert.deepEqual(numericConstants(src), new Map());
});

test('a dist tree is assembled output, so its copy of a constant is never a duplicate', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-dup-'));
  mkdirSync(join(root, 'react', 'dist', 'components'), { recursive: true });
  writeFileSync(join(root, 'react', 'Widget.jsx'), 'const HOUR_H = 44;\n');
  writeFileSync(join(root, 'react', 'dist', 'components', 'Widget.jsx'), 'const HOUR_H = 44;\n');
  assert.deepEqual([...sourceFiles(root)], [join(root, 'react', 'Widget.jsx')]);
  rmSync(root, { recursive: true });
});

test('generated output is out of scope, because a file emitted into every layer is one declaration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-dupe-generated-'));
  try {
    mkdirSync(join(dir, 'react'), { recursive: true });
    mkdirSync(join(dir, 'angular'), { recursive: true });
    writeFileSync(join(dir, 'react', 'Codec.generated.ts'), 'export const LOG_LIMIT = 40;\n');
    writeFileSync(join(dir, 'angular', 'Codec.generated.ts'), 'export const LOG_LIMIT = 40;\n');
    assert.deepEqual([...sourceFiles(dir)], [],
      'one source emitted twice cannot drift, and the gate holding it to that source would say so if it did');

    writeFileSync(join(dir, 'react', 'Hand.ts'), 'export const LOG_LIMIT = 40;\n');
    assert.equal([...sourceFiles(dir)].length, 1, 'a hand-written file beside it is still in scope');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
