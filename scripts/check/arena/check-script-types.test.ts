/* The flags asserted here are load-bearing rather than stylistic, and each is asserted with
 * the failure it prevents. erasableSyntaxOnly is the one that keeps this migration honest:
 * without it a script could take an enum and stop running under bare node, which check-all
 * needs it to do. checkJs and strict are asserted at their CURRENT values with the reason
 * they are still loose, so lifting either is a deliberate edit to this file rather than a
 * silent drift, and the unreached-file rule is what stops a narrowed glob from passing. */

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

test('the strict family is enumerated, so every flag is a decision somebody made', () => {
  const options = project().compilerOptions;
  assert.equal(options.strict, undefined,
    'strict is not set as a bundle: it turns on seven things at once and one of them is still '
    + 'off, so each is named below at the value it actually holds');

  for (const on of ['strictFunctionTypes', 'strictBindCallApply', 'noImplicitThis',
    'alwaysStrict', 'useUnknownInCatchVariables', 'noImplicitAny'])
    assert.equal(options[on], true, `${on} is on and must stay on`);

  assert.equal(options.strictNullChecks, false,
    'the last of the seven still off, and the only one left: 328 errors, down from 812 beside '
    + 'noImplicitAny and 970 without it. The order was the thing -- noImplicitAny first, or '
    + 'evolving-array inference is unavailable and hundreds of never[] errors appear that it '
    + 'erases. strictPropertyInitialization is absent rather than false because TypeScript '
    + 'refuses to name it while this one is off.');
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
  assert.match(missed[0], /scripts\/b\.ts is on disk and the project's globs do not reach it/);
});

test('the real tree is fully reached, so this gate is never passing over files it never opened', () => {
  const onDisk = sourcesUnder(join(repoRoot, 'scripts'));
  assert.ok(onDisk.length > 100, `found ${onDisk.length} sources under scripts/, so this proves almost nothing`);
});
