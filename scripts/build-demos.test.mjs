import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findJsxFiles } from './build-demos.mjs';

test('findJsxFiles excludes a suite and keeps a demo entry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'arena-find-jsx-'));
  try {
    const compDir = join(dir, 'display', 'tag');
    mkdirSync(compDir, { recursive: true });
    writeFileSync(join(compDir, 'Tag.jsx'), 'export function Tag() {}\n');
    writeFileSync(join(compDir, 'Tag.test.jsx'), "import test from 'node:test';\n");
    writeFileSync(join(compDir, 'Tag.dom.test.jsx'), "import test from 'node:test';\n");
    writeFileSync(join(dir, 'display', 'Display.card.entry.jsx'), 'export default null;\n');

    const found = findJsxFiles(dir).map((p) => p.slice(dir.length + 1));

    assert.deepEqual(found.sort(), [
      join('display', 'Display.card.entry.jsx'),
      join('display', 'tag', 'Tag.jsx'),
    ].sort());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
