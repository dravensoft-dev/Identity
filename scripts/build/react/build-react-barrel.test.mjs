import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  componentModules, barrelJs, barrelTypes, buildBarrel, zeroComponentProblems,
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
    { component: 'IconButton', path: './components/forms/icon-button/IconButton' },
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

test('the JS barrel keeps the .jsx extension the layer imports with', () => {
  const js = barrelJs([{ component: 'Tag', path: './components/display/tag/Tag' }]);
  assert.match(js, /export \* from '\.\/components\/display\/tag\/Tag\.jsx';/);
  for (const helper of HELPERS) assert.match(js, new RegExp(`export \\* from '\\./${helper}\\.js';`));
});

test('the type barrel drops every extension and leads with the contract types', () => {
  const types = barrelTypes([{ component: 'Tag', path: './components/display/tag/Tag' }]);
  assert.match(types, /export \* from '\.\/components\/display\/tag\/Tag';/);
  assert.doesNotMatch(types, /\.jsx'/);
  for (const t of TYPE_ONLY) assert.ok(types.indexOf(`'./${t}'`) < types.indexOf('/tag/Tag'));
});

test('both files carry the banner naming the generator', () => {
  const modules = [{ component: 'Tag', path: './components/display/tag/Tag' }];
  assert.ok(barrelJs(modules).startsWith(BANNER));
  assert.ok(barrelTypes(modules).startsWith(BANNER));
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
  assert.match(problems[0], /Tag: no .*Tag\.d\.ts, so the package would ship it untyped/);
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
  assert.equal(files.size, 2);
});
