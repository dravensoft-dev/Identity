/* The cases that make a naive regex scanner wrong: a `//` inside a string, a
 * regex literal, or a template literal is not a comment. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { findComments } from './lib/comments.mjs';

test('a line comment is found, with its line number', () => {
  const found = findComments('const a = 1;\n// gone\nconst b = 2;');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 2);
  assert.equal(found[0].text, '// gone');
});

test('a block comment reports how many lines it spans', () => {
  const found = findComments('/* one\n * two\n * three */\nconst a = 1;');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 1);
  assert.equal(found[0].lines, 3);
});

test('a `//` inside a string literal is not a comment', () => {
  assert.deepEqual(findComments('const u = "http://example.com/x";'), []);
  assert.deepEqual(findComments("const u = 'a // b';"), []);
});

test('a `/*` inside a string literal is not a comment', () => {
  assert.deepEqual(findComments('const s = "/* not a comment */";'), []);
});

test('a regex literal containing slashes is not a comment', () => {
  assert.deepEqual(findComments('const r = /a\\/\\/b/g;'), []);
  assert.deepEqual(findComments('const r = text.replace(/\\/\\*.*\\*\\//g, "");'), []);
  assert.deepEqual(findComments('const r = /[/]/;'), []);
});

test('division is not mistaken for a regex, so the comment after it is still found', () => {
  const found = findComments('const a = 1 / 2; // gone');
  assert.equal(found.length, 1);
  assert.equal(found[0].text, '// gone');
});

test('a `//` inside a template literal is not a comment', () => {
  assert.deepEqual(findComments('const t = `a // b ${x} c`;'), []);
});

test('a comment inside a template interpolation IS found, at the right line', () => {
  const found = findComments('const t = `a\nb ${x /* here */} c`;');
  assert.equal(found.length, 1);
  assert.equal(found[0].text, '/* here */');
  assert.equal(found[0].line, 2);
});

test('several comments come back in line order', () => {
  const found = findComments('// one\nconst a = 1;\n/* two */\n// three');
  assert.deepEqual(found.map((c) => c.line), [1, 3, 4]);
});

test('an unterminated block comment is still reported rather than swallowing the file', () => {
  const found = findComments('const a = 1;\n/* never closed');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 2);
});
