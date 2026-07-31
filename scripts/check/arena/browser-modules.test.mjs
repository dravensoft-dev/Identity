import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/repo-root.mjs';

const MODULES = ['intro/overview.js', 'intro/theme.js'];

const BROWSER_GLOBAL = /\b(document|window|navigator|location|fetch)\b.*(is not defined|undefined)|Can't find variable/i;

for (const file of MODULES) {
  test(`${file} parses`, async () => {
    let error = null;
    try {
      await import(`${pathToFileURL(join(root, file)).href}?t=${Date.now()}`);
    } catch (err) {
      error = err;
    }
    if (!error) return;
    assert.ok(
      error instanceof ReferenceError && BROWSER_GLOBAL.test(error.message),
      `${file} failed to parse or threw unexpectedly: ${error.constructor.name}: ${error.message}`,
    );
  });
}
