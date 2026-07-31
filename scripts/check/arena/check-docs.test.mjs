/* Exercises the gate against a temporary tree rather than the repository, so a
 * real file moving does not silently change what these assertions prove. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MAX_DOCUMENT_CHARS, HEADER_MAX_LINES, SIZE_EXEMPT, PROSE_EXEMPT, BANNED_PUNCTUATION,
  documentSizeProblems, commentRuleProblems, punctuationProblems, zeroScanProblems,
  isGenerated, allowsHeader,
} from './check-docs.mjs';

function tree(files) {
  const root = mkdtempSync(join(tmpdir(), 'arena-docs-'));
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

test('a document over the limit is reported with its size', () => {
  const root = tree({ 'README.md': 'x'.repeat(MAX_DOCUMENT_CHARS + 1) });
  const { problems } = documentSizeProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /README\.md: 60001 characters/);
  rmSync(root, { recursive: true });
});

test('a document exactly at the limit passes', () => {
  const root = tree({ 'README.md': 'x'.repeat(MAX_DOCUMENT_CHARS) });
  assert.deepEqual(documentSizeProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a dist tree is assembled output and is read by nothing', () => {
  const root = tree({
    'README.md': 'a',
    'frameworks/react/dist/README.md': 'an em dash — lands here, copied from a document that already passed',
    'frameworks/react/dist/Button.jsx': '// one comment\n// and a second\nexport const a = 1;\n',
  });
  assert.deepEqual(punctuationProblems(root).problems, []);
  assert.deepEqual(commentRuleProblems(root).problems, []);
  assert.equal(documentSizeProblems(root).scanned, 1);
  rmSync(root, { recursive: true });
});

test('both document rules report how many documents they actually read', () => {
  const root = tree({ 'README.md': 'a', 'docs/a.md': 'b', 'x/y/Z.md': 'c', 'notes.txt': 'd' });
  assert.equal(documentSizeProblems(root).scanned, 3);
  assert.equal(punctuationProblems(root).scanned, 3);
  rmSync(root, { recursive: true });
});

test('DOUBTS.md, CHANGELOG.md and docs/ are exempt from the size limit', () => {
  const over = 'x'.repeat(MAX_DOCUMENT_CHARS + 1);
  const root = tree({
    'DOUBTS.md': over,
    'CHANGELOG.md': over,
    'docs/superpowers/specs/a.md': over,
  });
  assert.deepEqual(documentSizeProblems(root).problems, []);
  assert.deepEqual(SIZE_EXEMPT, ['DOUBTS.md', 'CHANGELOG.md', join('docs', '')]);
  rmSync(root, { recursive: true });
});

test('an em dash in prose is reported with its position and the whole run', () => {
  const root = tree({ 'README.md': 'The gate — it holds.\n' });
  const { problems } = punctuationProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /README\.md:1:10: an em dash/);
  assert.match(problems[0], /The gate — it holds\./);
  rmSync(root, { recursive: true });
});

test('every em dash on a line is reported, not just the first', () => {
  const root = tree({ 'README.md': 'a — b — c\n' });
  assert.equal(punctuationProblems(root).problems.length, 2);
  rmSync(root, { recursive: true });
});

test('an em dash inside a fence or a code span is the document quoting code', () => {
  const root = tree({
    'a.md': '```jsx\n<Radio hint="Real users — approval" />\n```\n',
    'b.md': 'the token `--a — b` resolves\n',
  });
  assert.deepEqual(punctuationProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a colon, a comma and an en dash between numbers are all fine', () => {
  const root = tree({ 'README.md': 'It holds: one, two. Steps 1–5 run.\n' });
  assert.deepEqual(punctuationProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('docs/ is exempt from the punctuation rule and DOUBTS.md is not', () => {
  const root = tree({
    'docs/superpowers/plans/a.md': 'a — b\n',
    'DOUBTS.md': 'a — b\n',
    'CHANGELOG.md': 'a — b\n',
  });
  const { problems } = punctuationProblems(root);
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.startsWith('DOUBTS.md')));
  assert.ok(problems.some((p) => p.startsWith('CHANGELOG.md')));
  rmSync(root, { recursive: true });
});

test('the two maps the punctuation rule reads are asserted by name', () => {
  assert.deepEqual(Object.keys(PROSE_EXEMPT), [join('docs', '')]);
  for (const reason of Object.values(PROSE_EXEMPT)) assert.match(reason, /\w/);
  assert.deepEqual(BANNED_PUNCTUATION, [['—', 'an em dash']]);
});

test('a framework source carrying any comment is a problem', () => {
  const root = tree({ 'frameworks/react/components/a/A.jsx': '// nope\nexport const A = 1;\n' });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /only scripts and tests may/);
  rmSync(root, { recursive: true });
});

test('a framework source with no comments passes', () => {
  const root = tree({ 'frameworks/react/components/a/A.jsx': 'export const A = 1;\n' });
  assert.deepEqual(commentRuleProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a script may carry one header, and a second comment is a problem', () => {
  const root = tree({ 'scripts/a.mjs': '/* header */\nconst a = 1;\n// second\n' });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a second comment/);
  rmSync(root, { recursive: true });
});

test('a header over the line limit is reported with its length', () => {
  const header = `/*${'\n *'.repeat(HEADER_MAX_LINES)} */`;
  const root = tree({ 'scripts/a.mjs': `${header}\nconst a = 1;\n` });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], new RegExp(`header is ${HEADER_MAX_LINES + 1} lines`));
  rmSync(root, { recursive: true });
});

test("a script's one comment must be the header, not buried mid-file", () => {
  const root = tree({ 'scripts/a.mjs': 'const a = 1;\n// late\n' });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /must be the file header/);
  rmSync(root, { recursive: true });
});

test('a test file gets the header allowance wherever it sits', () => {
  const root = tree({
    'frameworks/react/components/a/A.test.jsx': '/* header */\nconst a = 1;\n',
    'frameworks/angular/test/Harness.ts': '/* header */\nconst b = 1;\n',
  });
  assert.deepEqual(commentRuleProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a @ts- pragma is a directive, not the file\'s one allowed comment', () => {
  const root = tree({
    'frameworks/angular/components/a/A.ts': '// @ts-expect-error -- needed\nconst a = 1;\n',
  });
  assert.deepEqual(commentRuleProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a generated file is never read, however many comments it carries', () => {
  const root = tree({
    'frameworks/react/Tokens.generated.js': '// one\n// two\nexport const a = 1;\n',
    'frameworks/tailwind/components/a/A.manifest.generated.ts': '// one\nexport const a = 1;\n',
    'frameworks/react/components/a/A.generated.js': '// compiled\nexport const A = 1;\n',
    'frameworks/react/vendor/React.generated.js': '// bundled\nexport default 1;\n',
  });
  assert.deepEqual(commentRuleProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a hand-written file is read however loudly its header claims otherwise', () => {
  const root = tree({ 'frameworks/angular/B.ts': '/* GENERATED by build-x.mjs */\nconst b = 1;\n' });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /frameworks\/angular\/B\.ts/);
  rmSync(root, { recursive: true });
});

test('build/ is skipped at the root only, so the scripts phase directory of that name is still read', () => {
  const overLong = `/* ${'x\n * '.repeat(HEADER_MAX_LINES + 2)} */\nconst a = 1;\n`;
  const root = tree({
    'build/angular-test/Emitted.js': overLong,
    'scripts/build/react/build-demos.mjs': overLong,
  });
  const { problems } = commentRuleProblems(root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /scripts\/build\/react\/build-demos\.mjs/);
  rmSync(root, { recursive: true });
});

test('isGenerated reads the name and nothing else', () => {
  assert.equal(isGenerated('a/B.generated.ts'), true);
  assert.equal(isGenerated('a/B.manifest.generated.ts'), true);
  assert.equal(isGenerated('a/B.card.entry.generated.js'), true);
  assert.equal(isGenerated('a/B.ts'), false);
  assert.equal(isGenerated('a/B.manifest.ts'), false);
});

test('a generator is not its own output, and content never overrides the name', () => {
  const generator = "export const BANNER = '/* GENERATED by scripts/x.mjs */';\n";
  assert.equal(isGenerated('scripts/x.mjs', generator), false);
  assert.equal(isGenerated('a/B.ts', '/* GENERATED by x.mjs */\n'), false);
  assert.equal(isGenerated('a/B.generated.ts', 'const a = 1;'), true);
});

test('allowsHeader covers scripts, a .test. infix and a test/ directory', () => {
  assert.equal(allowsHeader(join('scripts', 'a.mjs')), true);
  assert.equal(allowsHeader(join('frameworks', 'react', 'a', 'A.test.jsx')), true);
  assert.equal(allowsHeader(join('frameworks', 'angular', 'test', 'Harness.ts')), true);
  assert.equal(allowsHeader(join('frameworks', 'react', 'a', 'A.jsx')), false);
});

test('a walk that reaches nothing is a failure, not a vacuous pass', () => {
  assert.deepEqual(zeroScanProblems({ documents: 1, sources: 1 }), []);
  assert.match(zeroScanProblems({ documents: 0, sources: 1 })[0], /no \.md files at all/);
  assert.match(zeroScanProblems({ documents: 1, sources: 0 })[0], /no source files at all/);
  assert.equal(zeroScanProblems({ documents: 0, sources: 0 }).length, 2);
});

test('a shebang may precede the header, because a bin entry point is run by the shell', () => {
  const root = tree({
    'scripts/run.mjs': '#!/usr/bin/env node\n/* what this command does */\nexport const a = 1;\n',
  });
  assert.deepEqual(commentRuleProblems(root).problems, []);
  rmSync(root, { recursive: true });
});

test('a shebang buys no second comment, and no comment below the header', () => {
  const root = tree({
    'scripts/run.mjs': '#!/usr/bin/env node\nexport const a = 1;\n/* not the header */\n',
  });
  assert.equal(commentRuleProblems(root).problems.length, 1);
  rmSync(root, { recursive: true });
});
