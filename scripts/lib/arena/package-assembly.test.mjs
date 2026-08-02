import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  EXCLUDED_NAMES, EXCLUDED_PATTERNS, CSS_CHAIN, arenaCssHeader, excluded,
  collectFiles, reset, write, copyTree, baseManifest, version,
} from './package-assembly.mjs';
import { repoRoot } from './repo-root.mjs';

function tree(files) {
  const root = mkdtempSync(join(tmpdir(), 'arena-assembly-'));
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

test('a test never ships, whichever extension it takes', () => {
  for (const name of ['Tag.test.ts', 'Tag.test.tsx', 'Button.test.jsx', 'Button.dom.test.jsx', 'theme-css.test.mjs']) {
    assert.equal(excluded(name), true, name);
  }
});

test('a demo, a specimen, a binding and a prompt never ship either', () => {
  for (const name of ['Tag.card.html', 'Tag.card.entry.ts', 'Button.card.entry.jsx',
    'Tag.behaviour.json', 'Tag.prompt.md', 'Button.generated.js', 'BehaviourDelegated.json',
    'tsconfig.test.json', 'tsconfig.check.json']) {
    assert.equal(excluded(name), true, name);
  }
});

test('a whole directory of somebody else\'s output never ships', () => {
  assert.deepEqual([...EXCLUDED_NAMES].sort(), ['build', 'dist', 'node_modules', 'test', 'vendor']);
  for (const name of EXCLUDED_NAMES) assert.equal(excluded(name), true, name);
});

test('a real source is not swept up by any of those patterns', () => {
  for (const name of ['Tag.ts', 'Tag.variants.ts', 'Button.jsx', 'Button.d.ts', 'index.ts',
    'Tokens.generated.ts', 'Tag.manifest.generated.ts', 'CalendarInternals.js']) {
    assert.equal(excluded(name), false, name);
  }
  assert.ok(EXCLUDED_PATTERNS.length > 0);
});

test('the walk honours the exclusion list at every depth', () => {
  const root = tree({
    'components/display/tag/Tag.ts': '',
    'components/display/tag/Tag.test.ts': '',
    'components/display/tag/Tag.card.html': '',
    'test/Harness.ts': '',
    'dist/Old.ts': '',
    'node_modules/x/index.ts': '',
  });
  assert.deepEqual(
    collectFiles(root).map((p) => p.slice(root.length + 1)),
    [join('components', 'display', 'tag', 'Tag.ts')],
  );
  rmSync(root, { recursive: true });
});

test('the walk of a directory that is not there is empty rather than a throw', () => {
  assert.deepEqual(collectFiles(join(tmpdir(), 'arena-nothing-here-at-all')), []);
});

test('reset empties a directory that already has a previous build in it', () => {
  const root = tree({ 'dist-probe/stale.js': 'old' });
  const dir = join(root, 'dist-probe');
  reset(dir);
  assert.equal(existsSync(join(dir, 'stale.js')), false);
  assert.equal(existsSync(dir), true);
  rmSync(root, { recursive: true });
});

test('copyTree carries a nested tree and drops what is excluded', () => {
  const from = tree({ 'a/b/Keep.ts': 'k', 'a/b/Drop.test.ts': 'd', 'a/test/Also.ts': 'x' });
  const to = mkdtempSync(join(tmpdir(), 'arena-assembly-out-'));
  const written = copyTree(from, to, 'bin');
  assert.equal(written.length, 1);
  assert.equal(readFileSync(join(to, 'bin', 'a', 'b', 'Keep.ts'), 'utf8'), 'k');
  rmSync(from, { recursive: true });
  rmSync(to, { recursive: true });
});

test('the CSS chain leads with the reset and ends with the derivations', () => {
  assert.equal(CSS_CHAIN[0].to, 'css/reset.css');
  assert.deepEqual(CSS_CHAIN.slice(-2).map((c) => c.to), ['css/colors.css', 'css/environment.css'],
    'both hand-authored derivation sheets read tokens the generated ones declare, so both come '
    + 'after them: colors.css derives from --color-base-content and environment.css from --sp-*');
  for (const { from } of CSS_CHAIN) {
    assert.equal(existsSync(join(repoRoot, from)), true, `${from} is in the chain and not in the tree`);
  }
});

test('the stylesheet header names the package it is in', () => {
  assert.match(arenaCssHeader('@dravensoft/arena-angular'), /^\/\* @dravensoft\/arena-angular/);
});

test('the manifest takes its version and its identity from plugin.json, never from itself', () => {
  const base = baseManifest(repoRoot);
  assert.equal(base.version, version(repoRoot));
  assert.equal(base.publishConfig.access, 'public');
  assert.match(base.repository.url, /^git\+https:\/\/github\.com\//);
  assert.equal(base.bin['arena-theme'], './bin/arena-theme.mjs');
});

test('write creates the directories leading to a file nobody made yet', () => {
  const root = mkdtempSync(join(tmpdir(), 'arena-assembly-'));
  write(root, 'a/b/c/File.css', 'body{}');
  assert.equal(readFileSync(join(root, 'a', 'b', 'c', 'File.css'), 'utf8'), 'body{}');
  rmSync(root, { recursive: true });
});
