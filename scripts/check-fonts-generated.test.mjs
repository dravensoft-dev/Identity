import test from 'node:test';
import assert from 'node:assert/strict';
import { facesIn, checkFonts } from './check-fonts-generated.mjs';

test('facesIn reads every font-family named inside an @font-face block', () => {
  const css = `@font-face {\n  font-family: 'Archivo';\n  font-weight: 400;\n}\n\n@font-face {\n  font-family: 'Archivo';\n  font-weight: 700;\n}\n`;
  assert.deepEqual([...facesIn(css)], ['Archivo']);
});

test('facesIn reads double-quoted family names too', () => {
  const css = `@font-face {\n  font-family: "Spline Sans Mono";\n  font-weight: 400;\n}\n`;
  assert.deepEqual([...facesIn(css)], ['Spline Sans Mono']);
});

test('a declared family with a face passes', () => {
  const faces = new Set(['Archivo', 'Familjen Grotesk']);
  assert.deepEqual(checkFonts(['Archivo', 'Familjen Grotesk'], faces), []);
});

test('a declared family with no face fails, naming the family and the fix', () => {
  const faces = new Set(['Archivo']);
  const errs = checkFonts(['Archivo', 'Inter'], faces);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /"Inter"/);
  assert.match(errs[0], /no @font-face/);
  assert.match(errs[0], /bun scripts\/fetch-fonts\.mjs/);
});

test('a generic fallback like system-ui is never in the declared list, so it is never required to have a face', () => {
  // families() (fetch-fonts.mjs) reads only the first $value entry per
  // font token — "system-ui", "sans-serif", "monospace" never reach
  // checkFonts's `declared` argument at all. Modeled here directly: an
  // empty faces set with a declared list that omits the fallbacks still
  // passes.
  const faces = new Set(['Archivo']);
  assert.deepEqual(checkFonts(['Archivo'], faces), []);
});

test('multiple missing families each get their own message', () => {
  const errs = checkFonts(['Archivo', 'Inter', 'Comic Sans'], new Set());
  assert.equal(errs.length, 3);
});
