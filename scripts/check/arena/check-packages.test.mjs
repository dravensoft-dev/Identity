import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PACKAGES, GENERATED_PALETTE, distDir, stripAtStatements,
  paletteEquivalenceProblems, manifestProblems, exportProblems, collect,
} from './check-packages.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

const generated = ':root{--color-primary:#b52a20;--color-base-100:#141010;}';

test('an equal pair reports nothing and says how much it looked at', () => {
  const { problems, compared } = paletteEquivalenceProblems(generated, generated);
  assert.deepEqual(problems, []);
  assert.equal(compared, 2);
});

test('a value that differs names both emitters and both values', () => {
  const { problems } = paletteEquivalenceProblems(generated, ':root{--color-primary:#ff0000;--color-base-100:#141010;}');
  assert.deepEqual(problems, ['\:root --color-primary: Style Dictionary says #b52a20, arena-theme says #ff0000']);
});

test('a missing declaration is reported as emitting nothing rather than as absent', () => {
  const { problems } = paletteEquivalenceProblems(generated, ':root{--color-base-100:#141010;}');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /--color-primary: .* arena-theme says \(nothing\)/);
});

test('a colour the CLI invents is a problem in the other direction', () => {
  const { problems } = paletteEquivalenceProblems(generated, `${generated.slice(0, -1)}--color-brand:#000000;}`);
  assert.deepEqual(problems, ['\:root --color-brand: arena-theme emits it and Style Dictionary does not']);
});

test('a whole missing block is one problem, not one per declaration', () => {
  const { problems } = paletteEquivalenceProblems(`${generated}.arena-light{--color-primary:#b52a20;}`, generated);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /declares \.arena-light and arena-theme emits no such block/);
});

test('a comparison that looked at nothing fails rather than passing vacuously', () => {
  const { problems, compared } = paletteEquivalenceProblems(':root{--picker-invert:1;}', ':root{--picker-invert:1;}');
  assert.equal(compared, 0);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /compared 0 declarations/);
});

test('only colours are compared, so the CLI may emit what the token pipeline does not', () => {
  const { problems } = paletteEquivalenceProblems(generated, `${generated.slice(0, -1)}--picker-invert:1;--font-body:'A';}`);
  assert.deepEqual(problems, []);
});

test('an at-statement above the first block does not swallow the selector after it', () => {
  const withImports = `@import url('https://fonts.googleapis.com/css2?family=Archivo');\n${generated}`;
  assert.deepEqual(paletteEquivalenceProblems(generated, withImports).problems, []);
  assert.match(stripAtStatements(withImports), /^\s*:root\{/);
});

const manifest = (overrides = {}) => ({
  name: '@dravensoft/arena-react',
  version: '4.1.0',
  types: './Index.d.ts',
  peerDependencies: { react: '>=18', '@phosphor-icons/web': '^2.1.2' },
  ...overrides,
});

test('a well-formed manifest reports nothing', () => {
  assert.deepEqual(manifestProblems(PACKAGES[0], manifest(), '4.1.0'), []);
});

test('a version out of step with plugin.json is reported with both', () => {
  const problems = manifestProblems(PACKAGES[0], manifest({ version: '4.0.0' }), '4.1.0');
  assert.deepEqual(problems, ['@dravensoft/arena-react: version 4.0.0, and .claude-plugin/plugin.json says 4.1.0']);
});

test('private is a problem, because a private package can never be published', () => {
  assert.deepEqual(manifestProblems(PACKAGES[0], manifest({ private: true }), '4.1.0'),
    ['@dravensoft/arena-react: private, so it can never be published']);
});

test('an install script is refused, whichever of the three names it takes', () => {
  for (const hook of ['preinstall', 'install', 'postinstall']) {
    const problems = manifestProblems(PACKAGES[0], manifest({ scripts: { [hook]: 'node x.js' } }), '4.1.0');
    assert.equal(problems.length, 1, hook);
    assert.match(problems[0], /declares an install script/);
  }
});

test('Phosphor is the consumer\'s, so bundling it or omitting the peer are both problems', () => {
  const bundled = manifestProblems(PACKAGES[0], manifest({ dependencies: { '@phosphor-icons/web': '^2.1.2' } }), '4.1.0');
  assert.ok(bundled.some((p) => /never a dependency/.test(p)));

  const missing = manifestProblems(PACKAGES[0], manifest({ peerDependencies: { react: '>=18' } }), '4.1.0');
  assert.deepEqual(missing, ['@dravensoft/arena-react: no peer on @phosphor-icons/web, and every component renders ph-* classes']);
});

test('an Arena package is always a peer, never a dependency', () => {
  const problems = manifestProblems(PACKAGES[0], manifest({ dependencies: { '@dravensoft/arena-angular': '4.1.0' } }), '4.1.0');
  assert.ok(problems.some((p) => /is a dependency; an Arena package is always a peer/.test(p)));
});

function assembled(files) {
  const dir = mkdtempSync(join(tmpdir(), 'arena-pkg-'));
  for (const [path, body] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

test('every exports target must have been emitted', () => {
  const dir = assembled({ 'README.md': '#', 'Index.js': '', 'Index.d.ts': '', 'css/reset.css': '' });
  const m = manifest({ exports: { '.': { import: './Index.js' }, './css/reset.css': './css/reset.css' } });
  assert.deepEqual(exportProblems(PACKAGES[0], m, dir), []);

  const m2 = manifest({ exports: { '.': './Missing.js' } });
  assert.deepEqual(exportProblems(PACKAGES[0], m2, dir),
    ['@dravensoft/arena-react: exports ./Missing.js, which was never emitted']);
  rmSync(dir, { recursive: true });
});

test('a wildcard target is not resolved, because it names a family rather than a file', () => {
  const dir = assembled({ 'README.md': '#', 'Index.d.ts': '', 'css/a.css': '' });
  const m = manifest({ exports: { './css/*': './css/*' } });
  assert.deepEqual(exportProblems(PACKAGES[0], m, dir), []);
  rmSync(dir, { recursive: true });
});

test('a package exposing nothing is a problem, and so is a bin that was never emitted', () => {
  const dir = assembled({ 'README.md': '#', 'Index.d.ts': '' });
  assert.match(exportProblems(PACKAGES[0], manifest(), dir)[0], /no exports target resolves/);
  const m = manifest({ exports: { '.': './README.md' }, bin: { 'arena-theme': './bin/arena-theme.mjs' } });
  assert.deepEqual(exportProblems(PACKAGES[0], m, dir),
    ['@dravensoft/arena-react: bin arena-theme points at ./bin/arena-theme.mjs, which was never emitted']);
  rmSync(dir, { recursive: true });
});

test('a package with no README is a problem, because that is the page npm shows', () => {
  const dir = assembled({ 'Index.js': '', 'Index.d.ts': '' });
  const m = manifest({ exports: { '.': './Index.js' } });
  assert.deepEqual(exportProblems(PACKAGES[0], m, dir), ['@dravensoft/arena-react: no README.md, which is the page npm shows']);
  rmSync(dir, { recursive: true });
});

test('a package advertising no declaration at the root is untyped to npm and to moduleResolution: node', () => {
  const dir = assembled({ 'README.md': '#', 'Index.js': '', 'Index.d.ts': '' });
  const m = manifest({ types: undefined, exports: { '.': { types: './Index.d.ts', import: './Index.js' } } });
  assert.deepEqual(exportProblems(PACKAGES[0], m, dir),
    ['@dravensoft/arena-react: no types and no typings at the root, so npm reads the package as untyped and a consumer on moduleResolution: node finds no declarations']);
  rmSync(dir, { recursive: true });
});

test('typings is the other spelling of the same claim, and ng-packagr writes that one', () => {
  const dir = assembled({ 'README.md': '#', 'Index.js': '', 'types/Index.d.ts': '' });
  const named = manifest({ types: undefined, typings: 'types/Index.d.ts', exports: { '.': './Index.js' } });
  assert.deepEqual(exportProblems(PACKAGES[1], named, dir), []);

  const missing = manifest({ types: undefined, typings: 'types/Gone.d.ts', exports: { '.': './Index.js' } });
  assert.deepEqual(exportProblems(PACKAGES[1], missing, dir),
    ['@dravensoft/arena-angular: types types/Gone.d.ts, which was never emitted']);
  rmSync(dir, { recursive: true });
});

test('the two packages are named, and each dist sits under its own layer', () => {
  assert.deepEqual(PACKAGES.map((p) => p.name), ['@dravensoft/arena-react', '@dravensoft/arena-angular']);
  assert.equal(distDir('react', '/x'), join('/x', 'frameworks', 'react', 'dist'));
});

test('the repository passes its own equivalence claim, over more than nothing', () => {
  const { problems, compared } = collect(root);
  assert.deepEqual(problems, []);
  assert.ok(compared > 0, `${GENERATED_PALETTE} yielded no declaration to compare`);
});
