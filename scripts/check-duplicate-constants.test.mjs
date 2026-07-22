import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numericConstants } from './check-duplicate-constants.mjs';

test('finds a module-level numeric const', () => {
  assert.deepEqual(numericConstants('export const CHART_HEIGHT = 280;'), new Map([['CHART_HEIGHT', '280']]));
});

test('finds a const that is not exported', () => {
  assert.deepEqual(numericConstants('const HOUR_H = 44;'), new Map([['HOUR_H', '44']]));
});

test('finds a flat numeric object and normalises its whitespace', () => {
  assert.deepEqual(
    numericConstants('export const PAD = { t: 8, r: 8, b: 28, l: 44 };'),
    new Map([['PAD', '{t:8,r:8,b:28,l:44}']]),
  );
});

test('reads through an as const suffix', () => {
  assert.deepEqual(
    numericConstants('export const PAD = { t: 8 } as const;'),
    new Map([['PAD', '{t:8}']]),
  );
});

test('ignores a const initialised from an identifier', () => {
  assert.deepEqual(numericConstants('export const CHART_HEIGHT = chartHeight;'), new Map());
});

test('ignores a string const', () => {
  assert.deepEqual(numericConstants("const GUTTER = 'calc(var(--sp-1) * 14)';"), new Map());
});

test('ignores a const declared inside a function body', () => {
  const src = 'function f() {\n  const W = 320;\n}';
  assert.deepEqual(numericConstants(src), new Map());
});
