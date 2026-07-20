import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { BANNER, generatedPath, drift } from './check-tailwind-generated.mjs';

test('the committed stylesheet carries the generated banner', () => {
  const css = readFileSync(generatedPath(), 'utf8');
  assert.ok(css.startsWith(BANNER), 'utilities.css must start with the GENERATED banner');
});

test('the committed stylesheet is what the source compiles to', () => {
  assert.equal(drift(), null);
});

test('drift() reports the file when the committed text differs', () => {
  const fake = join(repoRoot, 'no', 'such', 'root');
  assert.notEqual(drift({ root: fake }), null);
});

test('the stylesheet a specimen loads carries real rules, not just the banner', () => {
  const css = readFileSync(generatedPath(), 'utf8');
  assert.ok(css.includes('.inline-flex'), 'a static utility must be present');
  assert.ok(css.includes('--color-primary'), 'the theme layer must be present');
});
