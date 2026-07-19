import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText } from './check-arbitrary-values.mjs';

const found = (s) => scanText(s).map((f) => f.cls);

test('flags a raw length', () => {
  assert.deepEqual(found('"root": "px-3 text-[13px] font-semibold"'), ['text-[13px]']);
});

test('flags a raw hex and a raw rgb', () => {
  assert.deepEqual(found('bg-[#b52a20] text-[rgb(20,16,16)]'), ['bg-[#b52a20]', 'text-[rgb(20,16,16)]']);
});

test('allows a var() reference to a token, with or without a type hint', () => {
  assert.deepEqual(found('h-[var(--dz-ctl-h)] duration-[var(--dur-mid)] border-[length:var(--bw-strong)]'), []);
});

test('allows a bracket that names properties rather than values', () => {
  assert.deepEqual(found('transition-[background,transform,box-shadow]'), []);
});

test('allows a keyword', () => {
  assert.deepEqual(found('bg-[currentColor]'), []);
});

test('does not flag array indexing or object access in JS', () => {
  assert.deepEqual(found('const s = SIZES[size] || SIZES.md; rows[0].cells[2]'), []);
});

test('does not flag a React inline style with a literal px', () => {
  assert.deepEqual(found("style={{ padding: '0 12px', fontSize: 13 }}"), []);
});
