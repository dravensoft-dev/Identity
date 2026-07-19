import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText, scanFile, markerAllowlist } from './check-arbitrary-values.mjs';

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

test('a marker exempts the class it lists, in a .md file', () => {
  const text = 'Don\'t: `text-[13px]`\n\n<!-- check-arbitrary-values allow: text-[13px] -->\n';
  assert.deepEqual(scanFile('a.prompt.md', text), []);
});

test('a listed class still fails in a .md file with no marker', () => {
  const errs = scanFile('a.prompt.md', 'Don\'t: `text-[13px]`\n');
  assert.equal(errs.length, 1);
  assert.match(errs[0], /`text-\[13px\]` — a raw value, not a token/);
});

test('an unlisted class still fails in a .md file that has a marker', () => {
  const text =
    'Don\'t: `text-[13px]` or `bg-[#b52a20]`\n\n<!-- check-arbitrary-values allow: text-[13px] -->\n';
  const errs = scanFile('a.prompt.md', text);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /`bg-\[#b52a20\]` — a raw value, not a token/);
});

test('two markers in one file union their allowances', () => {
  const text =
    'Don\'t: `text-[13px]` or `bg-[#b52a20]`\n\n' +
    '<!-- check-arbitrary-values allow: text-[13px] -->\n' +
    '<!-- check-arbitrary-values allow: bg-[#b52a20] -->\n';
  assert.deepEqual(markerAllowlist(text), new Set(['text-[13px]', 'bg-[#b52a20]']));
  assert.deepEqual(scanFile('a.prompt.md', text), []);
});

test('a stale allowance fails: a marker naming a class the file does not carry', () => {
  const text = 'No bad examples here.\n\n<!-- check-arbitrary-values allow: text-[13px] -->\n';
  const errs = scanFile('a.prompt.md', text);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /stale allowance `text-\[13px\]`/);
});

test('a marker in a non-.md file is itself reported as an error', () => {
  const text = '// <!-- check-arbitrary-values allow: text-[13px] -->\nconst x = "text-[13px]";\n';
  const errs = scanFile('a.jsx', text);
  assert.equal(errs.length, 2);
  assert.match(errs[0], /marker is only honoured in \.md files/);
  assert.match(errs[1], /`text-\[13px\]` — a raw value, not a token/);
});
