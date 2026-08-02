/* The gate reads the filesystem; these drive its pure functions with the shapes a real
 * mistake would produce, since the tree it guards is correct by construction today. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS, GENERATED, SHAPE, rootProblems, levelProblems, generatedProblems,
  zeroContractLevelProblems,
} from './check-contracts.mjs';

const ROOT_OK = ['README.md', 'api', 'behaviour', 'design', 'design-generated'];

test('the declared shape is three levels and one generated sibling, and nothing else', () => {
  assert.deepEqual(LEVELS, ['api', 'behaviour', 'design']);
  assert.equal(GENERATED, 'design-generated');
  assert.deepEqual([...SHAPE.keys()], LEVELS);
});

test('the real root shape has no problems', () => {
  assert.deepEqual(rootProblems(ROOT_OK), []);
});

test('a fourth directory beside the three is a problem, which is the case that passed every gate', () => {
  const problems = rootProblems([...ROOT_OK, 'tokens']);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /contracts\/tokens is not one of the three levels/);
});

test('a stray file at the roof is the same problem, because a level is not the only thing that can be added', () => {
  assert.match(rootProblems([...ROOT_OK, 'notes.md'])[0], /contracts\/notes\.md is not one of/);
});

test('a missing level is reported, not silently skipped', () => {
  assert.match(rootProblems(['README.md', 'api', 'design', 'design-generated'])[0], /contracts\/behaviour is missing/);
});

test('api keeps two vocabulary directories and behaviour keeps none', () => {
  const isDir = (n) => !n.includes('.');
  assert.deepEqual(levelProblems('api', ['README.md', 'components', 'types'], isDir), []);
  assert.deepEqual(levelProblems('behaviour', ['README.md', 'button.json', 'none.json'], isDir), []);
});

test('an unearned inner directory is a problem, and the message says why', () => {
  const isDir = (n) => n === 'patterns';
  const problems = levelProblems('behaviour', ['README.md', 'patterns'], isDir);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /is an inner directory contracts\/README\.md does not declare/);
  assert.match(problems[0], /earned, never assumed/);
});

test('a level missing its normative document is a problem', () => {
  const problems = levelProblems('behaviour', ['button.json'], () => false);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /contracts\/behaviour\/README\.md is missing/);
});

test('a stray file inside a level is caught by extension, which is how every reader of that level finds its work', () => {
  const problems = levelProblems('behaviour', ['README.md', 'button.json', 'scratch.txt'], () => false);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /contracts\/behaviour\/scratch\.txt is neither README\.md nor a \.json source/);
});

test('design keeps its two hand-authored stylesheets by name, because neither is a token source', () => {
  assert.deepEqual(
    levelProblems('design', ['README.md', 'TokenTypes.md', 'colors.css', 'reset.css', 'palette.dark.json'], () => false),
    [],
  );
});

test('design is the one level whose normative statement is two documents, split by audience', () => {
  const problems = levelProblems('design', ['TokenTypes.md', 'colors.css', 'reset.css'], () => false);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /contracts\/design\/README\.md is missing/);
});

test('a third stylesheet is a problem until contracts/README.md names it, which is the point of listing them', () => {
  const problems = levelProblems('design', ['README.md', 'TokenTypes.md', 'colors.css', 'reset.css', 'motion.css'], () => false);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /contracts\/design\/motion\.css is neither README\.md nor TokenTypes\.md nor colors\.css nor reset\.css/);
});

test('a generated stylesheet without the infix is a problem', () => {
  assert.deepEqual(generatedProblems(['palette.generated.css', 'fonts.generated.css']), []);
  assert.match(generatedProblems(['palette.css'])[0], /carries no \.generated\. infix/);
});

test('an empty result set fails rather than passing vacuously', () => {
  assert.deepEqual(zeroContractLevelProblems(46), []);
  assert.match(zeroContractLevelProblems(0)[0], /found 0 entries under contracts\//);
});
