import test from 'node:test';
import assert from 'node:assert/strict';
import { fontsCss, facesFromDisk, weightRange, recordProblems, FONTS } from './fetch-fonts.ts';

import { join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

test('a face becomes one @font-face rule with a two-hop url, and a range is written as a range', () => {
  const css = fontsCss([{ family: 'Archivo', weight: [400, 900], file: 'archivo.woff2' }]);
  assert.match(css, /font-family: 'Archivo';/);
  assert.match(css, /font-weight: 400 900;/);
  assert.match(css, /url\('\.\.\/\.\.\/assets\/fonts\/archivo\.woff2'\) format\('woff2'\)/);
});

test('weightRange takes the served weights and not what the token source asks for', () => {
  assert.deepEqual(weightRange([400, 500, 600, 700]), [400, 700]);
  assert.deepEqual(weightRange([900, 400, 700]), [400, 900]);
});

test('the header names the generator and the file itself, not the old tokens/ path', () => {
  const css = fontsCss([{ family: 'Archivo', weight: [400, 900], file: 'archivo.woff2' }]);
  assert.match(css, /contracts\/design-generated\/fonts\.generated\.css/);
  assert.match(css, /scripts\/generate\/core\/fetch-fonts\.ts/);
  assert.doesNotMatch(css, /tokens\//);
});

test('rules are separated by a blank line and the file ends in one newline', () => {
  const css = fontsCss([
    { family: 'Archivo', weight: [400, 900], file: 'archivo.woff2' },
    { family: 'Familjen Grotesk', weight: [400, 700], file: 'familjen-grotesk.woff2' },
  ]);
  assert.equal(css.split('@font-face').length - 1, 2);
  assert.match(css, /}\n\n@font-face/);
  assert.ok(css.endsWith('}\n'));
});

test('facesFromDisk reproduces one face per family, each carrying the range its binary really covers', () => {
  const faces = facesFromDisk(repoRoot);
  assert.equal(faces.length, 3, 'one variable file per family, not one per weight');
  assert.deepEqual(faces.map((f) => f.family), ['Archivo', 'Familjen Grotesk', 'Spline Sans Mono']);
  assert.deepEqual(faces.map((f) => f.weight), [[400, 900], [400, 700], [400, 700]],
    'the ranges are what Google SERVED, not what contracts/design/typography.json asks for -- that asks '
    + 'for 400-900 on all three, and two of the axes stop at 700, measured by rendering ink per weight');
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

    assert.throws(() => facesFromDisk(root), (err: Error) => {
      assert.match(err.message, /"Nonexistent Family"/);
      assert.match(err.message, /no assets\/fonts\//);
      return true;
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('recordProblems catches a swapped binary, a missing one, an unrecorded one and a bad range', () => {
  const record = { 'a.woff2': { family: 'A', weights: [400, 900], sha256: 'aa' } };
  assert.deepEqual(recordProblems(record, ['a.woff2'], () => 'aa'), []);
  assert.match(recordProblems(record, ['a.woff2'], () => 'bb')[0], /is not the one this repository shipped/);
  assert.match(recordProblems(record, [], () => 'aa')[0], new RegExp(`recorded in ${FONTS}`));
  assert.match(recordProblems(record, ['a.woff2', 'b.woff2'], () => 'aa')[0], /not recorded in/);
  const flat = { 'a.woff2': { family: 'A', weights: [400, 400], sha256: 'aa' } };
  assert.match(recordProblems(flat, ['a.woff2'], () => 'aa')[0], /needs a real min and max/);
});
