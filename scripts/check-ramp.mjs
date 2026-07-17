/* Asserts the shipped categorical ramp clears every measurable gate, in BOTH
 * themes, against the real chart surface (--color-base-200 — charts sit on the
 * card, not on the page background).
 *
 * The ramp is read from tokens/palette.css, never hardcoded here: swapping the
 * skin and re-running this is the whole point (see README → Theming).
 *
 *   node scripts/check-ramp.mjs      → exit 0 if both themes pass, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validate } from './validate-palette.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'tokens/palette.css'), 'utf8');

const SLOTS = 8;

/** Pull one theme block out of palette.css. The blocks contain no nested
 *  braces, so a non-greedy [^}]* is exact here — not a general CSS parser. */
function block(selector) {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`palette.css: no ${selector} block found`);
  return m[1];
}
function readVar(body, name) {
  const m = body.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`palette.css: --${name} missing or not a #rrggbb literal`);
  return m[1];
}
function theme(selector) {
  const body = block(selector);
  const ramp = Array.from({ length: SLOTS }, (_, i) => readVar(body, `color-cat-${i + 1}`));
  return { ramp, surface: readVar(body, 'color-base-200') };
}

const THEMES = [
  { name: 'dark', mode: 'dark', selector: ':root' },
  { name: 'light', mode: 'light', selector: '\\.arena-light' },
];

let ok = true;
for (const t of THEMES) {
  const { ramp, surface } = theme(t.selector);
  const result = validate(ramp, { mode: t.mode, surface, pairs: 'adjacent' });
  console.log(`\n${t.name} — ${SLOTS} slots on surface ${surface}`);
  for (const [name, state, detail] of result.report) {
    const glyph = state === true || state === 'pass' ? 'PASS' : state === 'floor' || state === 'relief' ? 'WARN' : 'FAIL';
    console.log(`  [${glyph.padEnd(4)}] ${name.padEnd(22)} ${detail}`);
  }
  // Arena holds a harder line than the validator's own exit code: the shipped
  // ramp needs NO relief rule and NO CVD floor-band warning. Every gate is a
  // hard gate here, so a swap that merely squeaks by does not pass silently.
  const warned = result.report.filter(([, s]) => s === 'floor' || s === 'relief');
  if (!result.ok || warned.length) {
    ok = false;
    for (const [name] of warned) console.log(`  → ${name}: WARN is a FAIL for Arena's ramp — no relief rule is allowed.`);
  }
}

console.log(ok ? '\nRamp OK — both themes clear every gate.\n' : '\nRamp FAILED — fix the marked checks.\n');
process.exit(ok ? 0 : 1);
