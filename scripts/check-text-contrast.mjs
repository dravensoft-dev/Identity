/* Asserts every muted text level Arena ships is legible on the real surfaces, in
 * BOTH themes. This exists because a WCAG AA claim for --mute-2 was published in
 * README.md after being verified by eye, in the dark theme only, and the light
 * theme sat at 3.46:1 for three releases. An unverifiable claim is what this
 * script retires — not just the two numbers.
 *
 * Nothing here is hardcoded: the surfaces come from tokens/palette.css and the
 * derivation percentages from tokens/colors.css, so re-skinning Arena and
 * re-running this is the whole point (see README -> Theming).
 *
 *   node scripts/check-text-contrast.mjs   -> exit 0 if all gates pass, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { contrast } from './validate-palette.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const palette = readFileSync(join(root, 'tokens/palette.css'), 'utf8');
const colors = readFileSync(join(root, 'tokens/colors.css'), 'utf8');

/** Pull one declaration block out of a token file. The blocks contain no nested
 *  braces, so a non-greedy [^}]* is exact here — not a general CSS parser. */
function block(css, selector, file) {
  const m = css.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`${file}: no ${selector} block found`);
  return m[1];
}
function readHex(body, name) {
  const m = body.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`palette.css: --${name} missing or not a #rrggbb literal`);
  return m[1];
}

// The derivations and aliases all live in one shared :root,.arena-light block —
// which is precisely why a percentage tuned for dark reached light unmeasured.
const structure = block(colors, ':root,\\s*\\.arena-light', 'colors.css');

/** Resolve a token to its percentage of --color-base-content.
 *  Follows var() chains and reads color-mix percentages. Returns null when the
 *  token is not declared at all, so a missing token reports rather than throws. */
function resolvePercent(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`colors.css: --${name} is a circular reference`);
  seen.add(name);
  const m = structure.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`));
  if (!m) return null;
  const value = m[1].trim();
  if (/^var\(\s*--color-base-content\s*\)$/.test(value)) return 100;
  const mix = value.match(/^color-mix\(\s*in oklab\s*,\s*var\(\s*--color-base-content\s*\)\s*([\d.]+)%\s*,\s*transparent\s*\)$/);
  if (mix) return Number(mix[1]);
  const alias = value.match(/^var\(\s*--([\w-]+)\s*\)$/);
  if (alias) return resolvePercent(alias[1], seen);
  throw new Error(`colors.css: --${name} resolves to "${value}", which is neither base-content, a color-mix of it, nor a var() alias`);
}

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
/** color-mix(in oklab, C p%, transparent) painted over a surface: the mix keeps
 *  C's coordinates and carries alpha = p, so what lands on screen is a plain
 *  alpha composite of C over the surface. */
const composite = (fg, bg, percent) => {
  const [f, b, a] = [hex2rgb(fg), hex2rgb(bg), percent / 100];
  return rgb2hex(f.map((c, i) => c * a + b[i] * (1 - a)));
};

const LEVELS = [
  { token: 'text-strong', gate: 4.5, note: 'body text' },
  { token: 'text-body', gate: 4.5, note: 'body text' },
  { token: 'text-muted', gate: 4.5, note: 'body text — tightest survivor in light' },
  { token: 'status-offline', gate: 3, note: 'graphical object (WCAG 1.4.11) — presence only' },
  // Reported, never gated. WCAG 1.4.3 and 1.4.11 both exempt inactive user
  // interface components, and Pagination's disabled controls MUST look
  // inactive: low contrast here is not a defect, it is the affordance.
  { token: 'mute-2-disabled', gate: null, note: 'EXEMPT — disabled controls (WCAG 1.4.3/1.4.11 inactive-component exemption)' },
];

// The faint text level, removed in 2.0.0. It failed WCAG AA in the light theme
// at 52% and could not be fixed in place: clearing AA there needs 61%, and
// --mute already sits at 62%, so nothing distinguishable fits below
// --text-muted. Re-introducing either token is what this asserts against —
// a level that does not fit is debt, not API.
const REMOVED = [
  { token: 'mute-2', use: '--mute (--text-muted)' },
  { token: 'text-faint', use: '--text-muted' },
];

const THEMES = [
  { name: 'dark', selector: ':root' },
  { name: 'light', selector: '\\.arena-light' },
];

let ok = true;

for (const { token, use } of REMOVED) {
  if (resolvePercent(token) === null) continue;
  ok = false;
  console.log(`\n[FAIL] --${token} is declared in tokens/colors.css. It was removed in 2.0.0 — use ${use}.`);
}
for (const t of THEMES) {
  const body = block(palette, t.selector, 'palette.css');
  const content = readHex(body, 'color-base-content');
  const surfaces = [
    ['base-100', readHex(body, 'color-base-100')],
    ['base-200', readHex(body, 'color-base-200')],
  ];
  console.log(`\n${t.name} — --color-base-content ${content} over ${surfaces.map(([n, h]) => `${n} ${h}`).join(', ')}`);
  for (const { token, gate, note } of LEVELS) {
    const percent = resolvePercent(token);
    if (percent === null) {
      ok = false;
      console.log(`  [FAIL] --${token.padEnd(16)} not declared in tokens/colors.css`);
      continue;
    }
    const ratios = surfaces.map(([n, hex]) => [n, contrast(composite(content, hex, percent), hex)]);
    const failed = gate !== null && ratios.some(([, r]) => r < gate);
    if (failed) ok = false;
    const glyph = gate === null ? 'INFO' : failed ? 'FAIL' : 'PASS';
    const detail = ratios.map(([n, r]) => `${n} ${r.toFixed(2)}:1`).join('  ');
    const bar = gate === null ? 'not gated' : `gate ${gate}:1`;
    console.log(`  [${glyph}] --${token.padEnd(16)} ${String(percent).padStart(3)}%  ${detail}  ${bar}`);
    console.log(`         ${note}`);
  }
}

console.log(ok ? '\nText contrast OK — every gated level clears its bar in both themes.\n' : '\nText contrast FAILED — fix the marked levels.\n');
process.exit(ok ? 0 : 1);
