import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  componentModules, barrel, buildBarrel, zeroComponentProblems,
  missingSourceProblems, duplicateExportProblems, HELPERS, TYPE_ONLY, ROOT_PRIVATE, BANNER,
} from './build-react-barrel.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

function layer(components) {
  const root = mkdtempSync(join(tmpdir(), 'arena-barrel-'));
  for (const [path, body] of Object.entries(components)) {
    const full = join(root, 'frameworks', 'react', path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

test('a component directory becomes one export, named from its kebab directory', () => {
  const root = layer({
    'components/forms/icon-button/IconButton.jsx': 'export function IconButton() {}',
    'components/forms/icon-button/IconButton.d.ts': 'export declare function IconButton(): JSX.Element;',
  });
  assert.deepEqual(componentModules(root), [
    { component: 'IconButton', path: './components/forms/icon-button/IconButton', ext: '.jsx' },
  ]);
  rmSync(root, { recursive: true });
});

test('components come out sorted by category then directory, so the file has one stable order', () => {
  const root = layer({
    'components/forms/button/Button.jsx': 'export function Button() {}',
    'components/forms/button/Button.d.ts': '',
    'components/display/tag/Tag.jsx': 'export function Tag() {}',
    'components/display/tag/Tag.d.ts': '',
    'components/display/avatar/Avatar.jsx': 'export function Avatar() {}',
    'components/display/avatar/Avatar.d.ts': '',
  });
  assert.deepEqual(componentModules(root).map((m) => m.component), ['Avatar', 'Tag', 'Button']);
  rmSync(root, { recursive: true });
});

test('a helper that is not a component is never exported, because it is not a directory', () => {
  const root = layer({
    'components/navigation/side-nav/SideNav.jsx': 'export function SideNav() {}',
    'components/navigation/side-nav/SideNav.d.ts': '',
    'components/navigation/side-nav/SideNavInject.jsx': 'export function injectInto() {}',
  });
  assert.deepEqual(componentModules(root).map((m) => m.component), ['SideNav']);
  rmSync(root, { recursive: true });
});

test('the barrel keeps whichever source extension each module is written in', () => {
  const jsx = barrel([{ component: 'Tag', path: './components/display/tag/Tag', ext: '.jsx' }]);
  assert.match(jsx, /export \* from '\.\/components\/display\/tag\/Tag\.jsx';/);
  const tsx = barrel([{ component: 'Badge', path: './components/display/badge/Badge', ext: '.tsx' }]);
  assert.match(tsx, /export \* from '\.\/components\/display\/badge\/Badge\.tsx';/);
  for (const helper of HELPERS) assert.match(jsx, new RegExp(`export \\* from '\\./${helper}\\.(js|ts)';`));
});

test('the contract types lead, and as a type-only export, so the runtime emit drops them', () => {
  const one = barrel([{ component: 'Tag', path: './components/display/tag/Tag', ext: '.tsx' }]);
  for (const t of TYPE_ONLY) {
    assert.match(one, new RegExp(`export type \\* from '\\./${t}\\.ts';`));
    assert.ok(one.indexOf(`'./${t}.ts'`) < one.indexOf('/tag/Tag'));
  }
  assert.ok(one.startsWith(BANNER));
});

test('an empty tree is a failure rather than an empty barrel', () => {
  assert.equal(zeroComponentProblems(0).length, 1);
  assert.match(zeroComponentProblems(0)[0], /an empty barrel is a failure, not a clean pass/);
  assert.deepEqual(zeroComponentProblems(1), []);
});

test('a component with no source, or no types, is named rather than skipped', () => {
  const root = layer({ 'components/display/tag/Tag.jsx': 'export function Tag() {}' });
  const problems = missingSourceProblems(componentModules(root), root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Tag: no .*Tag\.d\.ts beside the \.jsx, so the package would ship it untyped/);
  rmSync(root, { recursive: true });
});

test('a .tsx carries its own types, so it is not asked for a hand-written .d.ts', () => {
  const root = layer({ 'components/display/badge/Badge.tsx': 'export function Badge() {}' });
  assert.deepEqual(componentModules(root), [
    { component: 'Badge', path: './components/display/badge/Badge', ext: '.tsx' },
  ]);
  assert.deepEqual(missingSourceProblems(componentModules(root), root), []);
  rmSync(root, { recursive: true });
});

test('a directory holding neither extension is named, rather than exporting nothing quietly', () => {
  const root = layer({ 'components/display/tag/Tag.prompt.md': '# Tag\n' });
  const problems = missingSourceProblems(componentModules(root), root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no .*Tag\.jsx and no .*Tag\.tsx, so the barrel would export nothing/);
  rmSync(root, { recursive: true });
});

test('two components exporting one name is caught, because export * would shadow one', () => {
  const root = layer({
    'components/display/tag/Tag.jsx': 'export function Tag() {}\nexport const FIT = 3;',
    'components/display/tag/Tag.d.ts': '',
    'components/forms/button/Button.jsx': 'export function Button() {}\nexport const FIT = 4;',
    'components/forms/button/Button.d.ts': '',
  });
  const problems = duplicateExportProblems(componentModules(root), root);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /FIT is exported by both Tag and Button/);
  rmSync(root, { recursive: true });
});

test('Tokens.generated stays out, and ROOT_PRIVATE says why', () => {
  const { files } = buildBarrel(repoRoot);
  for (const content of files.values()) assert.doesNotMatch(content, /Tokens\.generated/);
  assert.deepEqual([...ROOT_PRIVATE.keys()], ['Tokens.generated']);
  for (const reason of ROOT_PRIVATE.values()) assert.match(reason, /re-theme/);
});

test('the repository builds a barrel over every component it has, and no problems', () => {
  const { problems, count, files } = buildBarrel(repoRoot);
  assert.deepEqual(problems, []);
  assert.ok(count > 0);
  assert.equal(files.size, 1);
});
