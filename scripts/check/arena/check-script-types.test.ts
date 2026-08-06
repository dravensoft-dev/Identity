/* The flags asserted here are load-bearing rather than stylistic, and each is asserted with
 * the failure it prevents. erasableSyntaxOnly is the one that keeps the migration honest:
 * without it a script could take an enum and stop running under bare node, which check-all
 * needs it to do. strict is asserted as a bundle now that every one of its seven is on, the
 * way both framework layers already declare it; checkJs stays named at false with the reason
 * it is loose, and the unreached-file rule is what stops a narrowed glob from passing. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { PROJECTS, CHECKED_EXTENSIONS, sourcesUnder, unreachedProblems } from './check-script-types.ts';

const project = () => JSON.parse(readFileSync(join(repoRoot, PROJECTS[0].project), 'utf8'));

test('the gate names a project that exists', () => {
  for (const { project: path } of PROJECTS)
    assert.ok(existsSync(join(repoRoot, path)), `${path} does not exist`);
});

test('erasableSyntaxOnly is on, so no script can take syntax bare node refuses to strip', () => {
  assert.equal(project().compilerOptions.erasableSyntaxOnly, true,
    'it forbids enum, namespace and parameter properties, the constructs node cannot strip; '
    + 'one of them under scripts/ would break the `node --test` half of check-all with tsc green');
});

test('the project never emits, because a checking project writing output would shadow the tree', () => {
  assert.equal(project().compilerOptions.noEmit, true);
  assert.equal(project().compilerOptions.allowImportingTsExtensions, true,
    'scripts import each other with the extension written out, which is what both runtimes resolve');
});

test('strict is on as a bundle, which is what both framework layers already declare', () => {
  const options = project().compilerOptions;
  assert.equal(options.strict, true,
    'all seven are on, so the enumeration this file used to carry is gone. What it cost, for '
    + 'the record: four of them nothing at all, useUnknownInCatchVariables seventeen catch '
    + 'clauses, noImplicitAny 1,643 annotations and strictNullChecks 970. The order between '
    + 'the last two was not free -- noImplicitAny first, or evolving-array inference is '
    + 'unavailable and hundreds of never[] errors appear that it erases.');

  for (const off of ['strictFunctionTypes', 'strictBindCallApply', 'noImplicitThis',
    'alwaysStrict', 'useUnknownInCatchVariables', 'noImplicitAny', 'strictNullChecks',
    'strictPropertyInitialization'])
    assert.equal(options[off], undefined,
      `${off} is named individually, which can only weaken what strict already turns on`);

  assert.equal(options.noUncheckedIndexedAccess, undefined,
    'the one tightening beyond strict that this project does not take: 716 errors, because '
    + 'every scripts/ read of arr[i] and m[k] becomes possibly-undefined. The React layer takes '
    + 'it and this one does not, so lifting it is a deliberate edit here rather than a drift.');
});

test('a .mjs is resolved and never checked, which is what the two vendored copies need', () => {
  const options = project().compilerOptions;
  assert.equal(options.allowJs, true,
    'validate-palette.mjs is imported by three .ts files, and turning this off would make '
    + 'those imports unresolvable rather than unchecked');
  assert.equal(options.checkJs, false,
    'it is vendored verbatim and can carry no annotation, so checking it reports noise it '
    + 'is forbidden to fix');
});

test('the project reaches both extensions, since dropping either stops covering half the tree', () => {
  const include = project().include ?? [];
  for (const ext of CHECKED_EXTENSIONS)
    assert.ok(include.some((p: string) => p.endsWith(ext)), `no ${ext} in include: ${JSON.stringify(include)}`);
});

test('sourcesUnder finds a script nested several directories deep, which a flat read would miss', () => {
  const root = mkdtempSync(join(tmpdir(), 'script-types-'));
  try {
    mkdirSync(join(root, 'check', 'arena'), { recursive: true });
    writeFileSync(join(root, 'check', 'arena', 'a.mjs'), '// a script');
    writeFileSync(join(root, 'check', 'arena', 'a.test.ts'), '// a suite');
    writeFileSync(join(root, 'notes.md'), '# not a source');
    assert.deepEqual(sourcesUnder(root).sort(), [
      join(root, 'check', 'arena', 'a.mjs'),
      join(root, 'check', 'arena', 'a.test.ts'),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a file the globs do not reach is reported, which is how a narrowed include is caught', () => {
  const onDisk = [join(repoRoot, 'scripts', 'a.mjs'), join(repoRoot, 'scripts', 'b.ts')];
  assert.deepEqual(unreachedProblems(onDisk, onDisk), []);
  const missed = unreachedProblems(onDisk, [onDisk[0]]);
  assert.equal(missed.length, 1);
  assert.match(missed[0] ?? '', /scripts\/b\.ts is on disk and the project's globs do not reach it/);
});

test('the real tree is fully reached, so this gate is never passing over files it never opened', () => {
  const onDisk = sourcesUnder(join(repoRoot, 'scripts'));
  assert.ok(onDisk.length > 100, `found ${onDisk.length} sources under scripts/, so this proves almost nothing`);
});
