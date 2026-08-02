import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogProblems, firstDifference, zeroCatalogProblems, trackingProblems } from './check-catalog.mjs';

test('the committed catalog matches a fresh emit', () => {
  const { problems } = catalogProblems();
  assert.deepEqual(problems, []);
});

test('the gate compared a real result set rather than an empty one', () => {
  const { declared } = catalogProblems();
  assert.ok(declared > 0, 'no component was declared, so a clean pass says nothing');
});

test('an untracked catalog is a problem, because it would reach no clone and no tag', () => {
  assert.equal(trackingProblems(false).length, 1);
  assert.match(trackingProblems(false)[0], /reaches no clone and no tag/);
  assert.deepEqual(trackingProblems(true), []);
});

test('an empty declaration is a problem, never a clean run', () => {
  assert.equal(zeroCatalogProblems(0).length, 1);
  assert.deepEqual(zeroCatalogProblems(50), []);
});

test('firstDifference names the line, so a stale catalog says where', () => {
  const at = firstDifference('a\nb\nc', 'a\nX\nc');
  assert.match(at, /^line 2: committed "X", generated "b"$/);
});

test('firstDifference reports a truncated file rather than reading past its end', () => {
  assert.match(firstDifference('a\nb', 'a'), /line 2: committed "\(end of file\)", generated "b"/);
});

test('two identical documents differ nowhere', () => {
  assert.equal(firstDifference('a\nb', 'a\nb'), null);
});
