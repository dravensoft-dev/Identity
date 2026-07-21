/* Parses the browser-side modules, which no other test imports.
 *
 * These files run only in a page, so nothing else here would notice a syntax
 * error in them — and a syntax error is silent in the worst way: the module
 * never executes, so even the page's own error handler never runs and it
 * renders nothing at all. That happened once to overview.js (a duplicated
 * `const density`) and this is the gate that catches the next one.
 *
 * Importing them is enough to parse them. They then fail at evaluation on a
 * browser global, which is expected and allowed — but ONLY that. Any other
 * failure, a parse error above all, fails the test. Deliberately written
 * without naming the parse-error class, which differs per runtime (Bun raises
 * BuildMessage, Node raises SyntaxError), so this gate stays portable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');

/** Browser entry points: they touch the DOM at module scope and are never imported elsewhere. */
const MODULES = ['overview.js', 'theme.js'];

const BROWSER_GLOBAL = /\b(document|window|navigator|location|fetch)\b.*(is not defined|undefined)|Can't find variable/i;

for (const file of MODULES) {
  test(`${file} parses`, async () => {
    let error = null;
    try {
      await import(`${pathToFileURL(join(root, file)).href}?t=${Date.now()}`);
    } catch (err) {
      error = err;
    }
    if (!error) return; // parsed and evaluated cleanly
    assert.ok(
      error instanceof ReferenceError && BROWSER_GLOBAL.test(error.message),
      `${file} failed to parse or threw unexpectedly: ${error.constructor.name}: ${error.message}`,
    );
  });
}
