import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../../lib/core/validate-palette.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

const css = readFileSync(join(root, 'contracts/design-generated/palette.generated.css'), 'utf8');

const SLOTS = 8;

function block(selector) {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  if (!m) throw new Error(`palette.generated.css: no ${selector} block found`);
  return m[1];
}
function readVar(body, name) {
  const m = body.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`palette.generated.css: --${name} missing or not a #rrggbb literal`);
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
  const options = { mode: t.mode, surface, pairs: 'adjacent' };
  const result = validate(ramp, options);
  console.log(`\n${t.name} — ${SLOTS} slots on surface ${surface}`);
  const rows = result.report as [string, boolean | string, string][];
  for (const [name, state, detail] of rows) {
    const glyph = state === true || state === 'pass' ? 'PASS' : state === 'floor' || state === 'relief' ? 'WARN' : 'FAIL';
    console.log(`  [${glyph.padEnd(4)}] ${name.padEnd(22)} ${detail}`);
  }

  const warned = rows.filter(([, s]) => s === 'floor' || s === 'relief');
  if (!result.ok || warned.length) {
    ok = false;
    for (const [name] of warned) console.log(`  → ${name}: WARN is a FAIL for Arena's ramp — no relief rule is allowed.`);
  }
}

console.log(ok ? '\nRamp OK — both themes clear every gate.\n' : '\nRamp FAILED — fix the marked checks.\n');
process.exit(ok ? 0 : 1);
