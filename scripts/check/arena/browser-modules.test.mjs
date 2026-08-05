/* The intro/ pages are ES modules a real browser loads over HTTP, so what they reach into
 * scripts/ is reached UNCOMPILED. That is what makes the second suite here part of the
 * TypeScript migration rather than a note about it: node resolves a .ts import and would
 * report these green while the page 404s or refuses the MIME type, so the rule has to be
 * about the specifier and not about whether the import works here. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

const MODULES = ['intro/overview.js', 'intro/theme.js'];

const REACHES_SCRIPTS = /from\s+['"]([^'"]*\/scripts\/[^'"]+)['"]/g;

export function browserReachableScripts(files = MODULES, base = root) {
  const found = new Set();
  for (const file of files) {
    const source = readFileSync(join(base, file), 'utf8');
    for (const m of source.matchAll(REACHES_SCRIPTS)) found.add(m[1].slice(m[1].indexOf('scripts/')));
  }
  return [...found].sort();
}

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

test('a module a browser loads is named as one, so this list is read rather than typed', () => {
  const reached = browserReachableScripts();
  assert.ok(reached.length > 0,
    'no intro/ module reaches scripts/ any more, so this suite proves nothing and the rule below is unheld');
  assert.deepEqual(reached, [
    'scripts/lib/arena/css-decls.mjs',
    'scripts/lib/core/token-preview.mjs',
  ]);
});

test('nothing a browser loads may be TypeScript, because nothing strips it on the way there', () => {
  for (const spec of browserReachableScripts()) {
    assert.ok(spec.endsWith('.mjs'),
      `${spec} is loaded by intro/ over HTTP, and a browser runs it as written: there is no build `
      + 'step between the git tag and the page, which is the same reason contracts/design-generated/ '
      + 'is tracked. Renaming it to .ts serves TypeScript to a browser, and static-server.mjs has no '
      + '.ts MIME type either, so the page fails while node -- which does strip types -- reports green.');
    assert.ok(existsSync(join(root, spec)), `${spec} is imported by an intro/ page and is not there`);
  }
});
