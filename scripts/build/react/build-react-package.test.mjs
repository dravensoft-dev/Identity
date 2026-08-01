import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rewriteSourceSpecifiers, kitSpecifiers, untypedProblems, isSource, manifest, NAME, ROOT_JS, ROOT_TS, ROOT_TYPES, LAYER } from './build-react-package.mjs';
import { version } from '../../lib/arena/package-assembly.mjs';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

test('a relative source specifier becomes .js, because the package holds no JSX and no TypeScript', () => {
  assert.equal(
    rewriteSourceSpecifiers("import { Button } from '../../forms/button/Button.jsx';"),
    "import { Button } from '../../forms/button/Button.js';",
  );
  assert.equal(
    rewriteSourceSpecifiers("export * from './components/display/tag/Tag.jsx';"),
    "export * from './components/display/tag/Tag.js';",
  );
});

test('a bare specifier is untouched, so react stays react', () => {
  const source = "import React from 'react';\nimport { render } from 'react-dom/client';";
  assert.equal(rewriteSourceSpecifiers(source), source);
});

test('a .js specifier is already right and is left alone', () => {
  const source = "import { catColor } from '../../../DataVisuals.js';";
  assert.equal(rewriteSourceSpecifiers(source), source);
});

test('the word jsx inside a path is not an extension', () => {
  const source = "import x from './jsx-loader.js';";
  assert.equal(rewriteSourceSpecifiers(source), source);
});

test('a .ts specifier reaches the tarball as .js, because dist holds no TypeScript', () => {
  assert.equal(rewriteSourceSpecifiers("from './UseDialogModal.ts'"), "from './UseDialogModal.js'");
  assert.equal(rewriteSourceSpecifiers("from '../../../DataVisuals.ts'"), "from '../../../DataVisuals.js'");
  assert.equal(rewriteSourceSpecifiers("from './Button.tsx'"), "from './Button.js'");
  assert.equal(rewriteSourceSpecifiers("from './Tokens.generated.js'"), "from './Tokens.generated.js'",
    'already .js, so the rewrite is a no-op rather than a doubling');
  assert.equal(rewriteSourceSpecifiers("from 'react'"), "from 'react'",
    'a bare specifier is the consumer\'s peer dependency and is never touched');
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
  assert.equal(m.peerDependencies.react, '^18 || ^19',
    'the range is the two majors a real tarball install was rendered under; an open >=18 would promise React 20');
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
  assert.ok(ROOT_JS.includes('Tokens.generated.js'),
    'DataVisuals imports it, so it ships even though the barrel does not export it');
  assert.ok(ROOT_JS.includes('Index.generated.js'));
  assert.deepEqual(ROOT_TYPES, ['Api.generated.d.ts'],
    'the contract types are declaration-only and have no module to compile');
  for (const name of ROOT_TS)
    assert.ok(name.endsWith('.ts'), `${name} is compiled, so it must be a TypeScript source`);
  assert.equal(LAYER, 'frameworks/react');
});

test('the kit names every module for what it is, and never doubles an infix', () => {
  assert.equal(kitSpecifiers("from './Button.tsx'", '.generated'), "from './Button.generated.js'");
  assert.equal(kitSpecifiers("from '../a/A'", '.generated'), "from '../a/A.generated.js'");
  assert.equal(kitSpecifiers("from './Tokens.generated.js'", '.generated'), "from './Tokens.generated.js'",
    'a module already carrying the infix must not gain a second one');
  assert.equal(kitSpecifiers("from 'react'", '.generated'), "from 'react'");
});

test('a relative .tsx specifier becomes .js too, so both extensions land on one package layout', () => {
  assert.equal(
    rewriteSourceSpecifiers("import { Badge } from '../../display/badge/Badge.tsx';"),
    "import { Badge } from '../../display/badge/Badge.js';",
  );
  assert.equal(
    rewriteSourceSpecifiers("import { sp1 } from '../../../Tokens.generated.js';"),
    "import { sp1 } from '../../../Tokens.generated.js';",
  );
});

test('a compiled module with no declaration beside it never ships', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-untyped-'));
  try {
    mkdirSync(join(dir, 'components'), { recursive: true });
    writeFileSync(join(dir, 'components', 'A.js'), 'export const a = 1;\n');
    writeFileSync(join(dir, 'components', 'A.d.ts'), 'export declare const a: number;\n');
    writeFileSync(join(dir, 'components', 'B.js'), 'export const b = 2;\n');
    const problems = untypedProblems(['components/A.js', 'components/B.js'], dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /components\/B\.js ships with no declaration/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a declaration is not mistaken for a source to compile', () => {
  assert.equal(isSource('a/Button.tsx'), true);
  assert.equal(isSource('a/Internals.ts'), true);
  assert.equal(isSource('a/Button.d.ts'), false);
  assert.equal(isSource('a/Tokens.generated.js'), false);
});
