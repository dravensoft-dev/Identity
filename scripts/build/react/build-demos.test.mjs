import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findSourceFiles, rewriteRelativeSourceImports, loaderFor, outputPathFor } from './build-demos.mjs';

test('a relative .jsx import points at the .generated.js sibling this script writes', () => {
  const code = 'import { Button } from "./Button.jsx";\nimport { A } from "../a/A.jsx";\n';
  assert.equal(
    rewriteRelativeSourceImports(code),
    'import { Button } from "./Button.generated.js";\nimport { A } from "../a/A.generated.js";\n',
  );
});

test('a bare package specifier ending in .jsx is left alone', () => {
  const code = 'import x from "some-pkg/thing.jsx";\n';
  assert.equal(rewriteRelativeSourceImports(code), code);
});

test('findSourceFiles excludes a suite and keeps a demo entry, in either extension', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-find-jsx-'));
  try {
    const compDir = join(dir, 'display', 'tag');
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, 'Tag.jsx'), 'export function Tag() {}\n');
    writeFileSync(join(compDir, 'Tag.test.jsx'), "import test from 'node:test';\n");
    writeFileSync(join(compDir, 'Tag.dom.test.jsx'), "import test from 'node:test';\n");
    writeFileSync(join(dir, 'display', 'Display.card.entry.jsx'), 'export default null;\n');
    const badgeDir = join(dir, 'display', 'badge');
    mkdirSync(badgeDir, { recursive: true });
    writeFileSync(join(badgeDir, 'Badge.tsx'), 'export function Badge() {}\n');
    writeFileSync(join(badgeDir, 'Badge.dom.test.tsx'), "import test from 'node:test';\n");

    const found = findSourceFiles(dir).map((p) => p.slice(dir.length + 1));

    assert.deepEqual(found.sort(), [
      join('display', 'Display.card.entry.jsx'),
      join('display', 'badge', 'Badge.tsx'),
      join('display', 'tag', 'Tag.jsx'),
    ].sort());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a relative .tsx import points at the same .generated.js sibling a .jsx one does', () => {
  const code = 'import { Badge } from "./Badge.tsx";\nimport { A } from "../a/A.jsx";\n';
  assert.equal(
    rewriteRelativeSourceImports(code),
    'import { Badge } from "./Badge.generated.js";\nimport { A } from "../a/A.generated.js";\n',
  );
});

test('the loader follows the file rather than the call site, so both extensions compile in one pass', () => {
  assert.equal(loaderFor('/x/Badge.tsx'), 'tsx');
  assert.equal(loaderFor('/x/Tag.jsx'), 'jsx');
  assert.equal(outputPathFor('a/Badge.tsx'), 'a/Badge.generated.js');
  assert.equal(outputPathFor('a/Tag.jsx'), 'a/Tag.generated.js');
});
