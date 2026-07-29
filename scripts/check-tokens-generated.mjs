/* Asserts the committed contracts/design-generated/*.css are what
 * contracts/design/ generates.
 *
 * The generated files are committed (the plugin is served from the release tag
 * and the copy-in kit reads them directly), so a stale committed file is a
 * silent failure — exactly the class of bug check-release.mjs exists for. This
 * script is the guard: it builds in memory and compares declaration sets.
 * Comments are not asserted, only `--name: value;` pairs and their selectors.
 *
 *   bun scripts/check-tokens-generated.mjs   -> exit 0 if in sync, 1 on drift
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildAll } from './build-tokens.mjs';
import { parseDecls } from './lib/css-decls.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const built = await buildAll();
const drift = [];

for (const [name, css] of built) {
  const expected = parseDecls(css);
  let actual;
  try {
    actual = parseDecls(readFileSync(join(root, 'contracts', 'design-generated', name), 'utf8'));
  } catch {
    drift.push(`contracts/design-generated/${name}: missing — run bun run build:tokens`);
    continue;
  }
  for (const [selector, decls] of expected) {
    const found = actual.get(selector);
    if (!found) { drift.push(`contracts/design-generated/${name}: missing selector ${selector}`); continue; }
    for (const [prop, value] of decls) {
      if (!found.has(prop)) drift.push(`contracts/design-generated/${name} ${selector}: missing --${prop}`);
      else if (found.get(prop) !== value)
        drift.push(`contracts/design-generated/${name} ${selector}: --${prop} is "${found.get(prop)}", generated "${value}"`);
    }
    for (const prop of found.keys())
      if (!decls.has(prop)) drift.push(`contracts/design-generated/${name} ${selector}: --${prop} is committed but no longer generated`);
  }
  for (const selector of actual.keys())
    if (!expected.has(selector)) drift.push(`contracts/design-generated/${name}: committed selector ${selector} is no longer generated`);
}

if (drift.length) {
  console.error(`check-tokens-generated: ${drift.length} drift(s) between contracts/design/ and the committed CSS\n`);
  for (const d of drift) console.error(`  ${d}`);
  console.error('\nRun: bun run build:tokens');
  process.exit(1);
}
console.log(`check-tokens-generated: ${built.size} file(s) in sync with contracts/design/`);
