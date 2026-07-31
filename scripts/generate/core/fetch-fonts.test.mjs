import test from 'node:test';
import assert from 'node:assert/strict';
import { fontsCss, facesFromDisk } from './fetch-fonts.mjs';

import { join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/repo-root.mjs';

test('a face becomes one @font-face rule with a two-hop url', () => {
  const css = fontsCss([{ family: 'Archivo', weight: 400, file: 'archivo-400.woff2' }]);
  assert.match(css, /font-family: 'Archivo';/);
  assert.match(css, /font-weight: 400;/);
  assert.match(css, /url\('\.\.\/\.\.\/assets\/fonts\/archivo-400\.woff2'\) format\('woff2'\)/);
});

test('the header names the generator and the file itself, not the old tokens/ path', () => {
  const css = fontsCss([{ family: 'Archivo', weight: 400, file: 'archivo-400.woff2' }]);
  assert.match(css, /contracts\/design-generated\/fonts\.css/);
  assert.match(css, /scripts\/fetch-fonts\.mjs/);
  assert.doesNotMatch(css, /tokens\//);
});

test('rules are separated by a blank line and the file ends in one newline', () => {
  const css = fontsCss([
    { family: 'Archivo', weight: 400, file: 'archivo-400.woff2' },
    { family: 'Archivo', weight: 700, file: 'archivo-700.woff2' },
  ]);
  assert.equal(css.split('@font-face').length - 1, 2);
  assert.match(css, /}\n\n@font-face/);
  assert.ok(css.endsWith('}\n'));
});

test('facesFromDisk skips a declared weight with no binary', () => {
  const faces = facesFromDisk(repoRoot);
  const familjen = faces.filter((f) => f.family === 'Familjen Grotesk').map((f) => f.weight);
  assert.deepEqual(familjen, [400, 500, 600, 700]);
});

test('facesFromDisk reproduces the fourteen faces the committed CSS declares', () => {
  assert.equal(facesFromDisk(repoRoot).length, 14);
});

test('facesFromDisk emits family by family, ascending weight within each', () => {
  const faces = facesFromDisk(repoRoot);
  assert.deepEqual([...new Set(faces.map((f) => f.family))],
    ['Archivo', 'Familjen Grotesk', 'Spline Sans Mono']);
  for (let i = 1; i < faces.length; i += 1)
    if (faces[i].family === faces[i - 1].family)
      assert.ok(faces[i].weight > faces[i - 1].weight);
});

test('facesFromDisk throws naming a family with no binary at all', () => {
  const root = mkdtempSync(join(tmpdir(), 'fetch-fonts-test-'));
  try {
    mkdirSync(join(root, 'contracts', 'design'), { recursive: true });
    mkdirSync(join(root, 'assets', 'fonts'), { recursive: true });
    writeFileSync(
      join(root, 'contracts', 'design', 'typography.json'),
      JSON.stringify({
        font: { display: { $value: ['Nonexistent Family', 'system-ui', 'sans-serif'] } },
        fw: { regular: { $value: 400 }, bold: { $value: 700 } },
      })
    );

    assert.throws(() => facesFromDisk(root), (err) => {
      assert.match(err.message, /"Nonexistent Family"/);
      assert.match(err.message, /no assets\/fonts\//);
      return true;
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
