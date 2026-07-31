import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rewriteJsxSpecifiers, manifest, NAME, ROOT_MODULES, LAYER } from './build-react-package.mjs';
import { version } from '../../lib/arena/package-assembly.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

test('a relative .jsx specifier becomes .js, because the package holds no JSX', () => {
  assert.equal(
    rewriteJsxSpecifiers("import { Button } from '../../forms/button/Button.jsx';"),
    "import { Button } from '../../forms/button/Button.js';",
  );
  assert.equal(
    rewriteJsxSpecifiers("export * from './components/display/tag/Tag.jsx';"),
    "export * from './components/display/tag/Tag.js';",
  );
});

test('a bare specifier is untouched, so react stays react', () => {
  const source = "import React from 'react';\nimport { render } from 'react-dom/client';";
  assert.equal(rewriteJsxSpecifiers(source), source);
});

test('a .js specifier is already right and is left alone', () => {
  const source = "import { catColor } from '../../../DataVisuals.js';";
  assert.equal(rewriteJsxSpecifiers(source), source);
});

test('the word jsx inside a path is not an extension', () => {
  const source = "import x from './jsx-loader.js';";
  assert.equal(rewriteJsxSpecifiers(source), source);
});

test('the manifest names the package, its entry and its types', () => {
  const m = manifest(repoRoot);
  assert.equal(m.name, NAME);
  assert.equal(m.type, 'module');
  assert.equal(m.exports['.'].types, './Index.generated.d.ts');
  assert.equal(m.exports['.'].import, './Index.generated.js');
});

test('the version is stamped from plugin.json rather than written here', () => {
  assert.equal(manifest(repoRoot).version, version(repoRoot));
});

test('react, react-dom and Phosphor are peers, and nothing is a dependency', () => {
  const m = manifest(repoRoot);
  assert.deepEqual(Object.keys(m.peerDependencies).sort(), ['@phosphor-icons/web', 'react', 'react-dom']);
  assert.equal(m.dependencies, undefined,
    'the components style themselves with inline tokens, so there is nothing to depend on');
});

test('the stylesheet and the example config are reachable by subpath', () => {
  const { exports } = manifest(repoRoot);
  assert.equal(exports['./arena.css'], './arena.css');
  assert.equal(exports['./css/*'], './css/*');
  assert.ok('./arena.config.example.json' in exports);
});

test('every layer-root module the package needs is named, and Tokens is among them', () => {
  assert.ok(ROOT_MODULES.includes('Tokens.generated.js'),
    'DataVisuals imports it, so it ships even though the barrel does not export it');
  assert.ok(ROOT_MODULES.includes('Index.generated.js'));
  assert.equal(LAYER, 'frameworks/react');
});
