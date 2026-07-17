/* Asserts every muted text level Arena ships is legible on the real surfaces,
 * and every surface/content pair the product paints text on is legible against
 * its own fill, in BOTH themes. This exists because a WCAG AA
 * claim for --mute-2 was published in README.md after being verified by eye, in
 * the dark theme only, and the light theme sat at 3.46:1 for three releases. An
 * unverifiable claim is what this script retires — not just the two numbers.
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
/** Same, but a missing token is a reportable FAIL rather than a stack trace: a
 *  swapped skin that simply forgot one should read its name off a report line,
 *  next to the check it broke, like every other failure here. */
function tryHex(body, name) {
  try { return readHex(body, name); } catch { return null; }
}
const MISSING = 'not declared in tokens/palette.css — every theme block must define it';

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

/** color-mix(in oklab, C keep%, black) — the fallback --danger-fill uses when a
 *  skin omits --color-error-fill. Black is oklab (0,0,0), so the mix is just
 *  C's oklab coords scaled by `keep`; this then converts back to #rrggbb. The
 *  forward conversion mirrors validate-palette.mjs (kept private there); the
 *  inverse is Ottosson's, and the pair is verified byte-exact against the
 *  browser's own color-mix (#e85151→#bb4040, #c33535→#9d2929). Kept here rather
 *  than imported so the vendored validator stays untouched. */
const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin2s = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
function toOklab(hex) {
  const [r, g, b] = hex2rgb(hex).map((c) => s2lin(c / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const rgb = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((c) => lin2s(c) * 255);
  return rgb2hex(rgb);
}
const darkenOklab = (hex, keep) => oklabToHex(toOklab(hex).map((v) => v * keep));

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

// Fill/content pairs. Gated at 4.5:1 — WCAG AA for normal text — wherever the
// product paints text on the fill: Button's label is 13–15px at every size
// (SIZES in forms/Button.jsx), which is normal text under 1.4.3, so no
// large-text relief applies. --on-accent also draws Checkbox's tick and
// Switch's knob, graphical objects needing only 3:1 under 1.4.11; the text gate
// is the stricter of the two and covers them.
//
// EVERY pair is gated, not only the ones the product paints today. The pair is
// the daisyUI contract — a fill and the color legible on top of it — and a skin
// defines all of them; gating only what a current component happens to render
// would let a skin ship an illegible pair that the next component to use that
// fill inherits. The cost is real and intended: a skin whose, say, warning
// fill can't carry its warning-content fails here even if nothing paints that
// combination yet. That failure is the signal — the pair would not survive use.
// --danger-fill's oklab fallback keeps this fraction of --color-error when a
// skin omits the pin. Must equal the percentage in colors.css's color-mix.
const FILL_FALLBACK_KEEP = 0.85;

const PAIRS = [
  { fill: 'primary', content: 'primary-content', gate: 4.5, note: 'button text via --on-accent (Button, IconButton solid, Pagination active); Checkbox tick, Switch knob' },
  // Pin OPTIONAL: --color-error-fill if a skin pins it, else derived from
  // --color-error exactly as colors.css does. Absence is not a failure.
  { fill: 'error-fill', content: 'error-content', gate: 4.5, deriveFrom: 'error', keep: FILL_FALLBACK_KEEP, note: "ConfirmDialog's final confirmation — Arena's only filled danger surface" },
  { fill: 'secondary', content: 'secondary-content', gate: 4.5, note: 'daisyUI pair — legible content on the fill' },
  { fill: 'neutral', content: 'neutral-content', gate: 4.5, note: 'daisyUI pair — legible content on the fill' },
  { fill: 'info', content: 'info-content', gate: 4.5, note: 'daisyUI pair — legible content on the fill' },
  { fill: 'success', content: 'success-content', gate: 4.5, note: 'daisyUI pair — legible content on the fill' },
  { fill: 'warning', content: 'warning-content', gate: 4.5, note: 'daisyUI pair — legible content on the fill' },
];

// Accents painted straight onto the base surfaces, with no fill of their own.
// The danger convention lives here: .btn.danger, .iconbtn.danger and .mitem.danger
// are transparent, so --color-error IS the text, gated at 4.5:1 under WCAG 1.4.3.
// The outline's border is a graphical object needing only 3:1 (1.4.11), so the
// text gate binds first and the border rides along on it.
//
// --color-primary and --color-secondary are measured but NOT gated. Both are
// painted as text somewhere (ConfirmDialog's eyebrow takes --crimson; gold marks
// highlighted data) and both sit far below 4.5:1 on one theme's surfaces — see
// the run output. Gating them would not tighten a token, it would repaint
// Dravensoft's brand, which is a decision for a human and not a side effect of
// this script. They are reported so the number stops being invisible.
const ON_SURFACE = [
  { token: 'error', gate: 4.5, note: 'outline danger — IS the text and the border (.btn.danger, .iconbtn.danger, .mitem.danger)' },
  { token: 'primary', gate: null, note: 'REPORTED, NOT GATED — crimson as text (ConfirmDialog eyebrow); brand value, see header' },
  { token: 'secondary', gate: null, note: 'REPORTED, NOT GATED — gold as text/focus ring; brand value, see header' },
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

  console.log(`\n${t.name} — fill/content pairs`);
  for (const { fill, content, gate, deriveFrom, keep, note } of PAIRS) {
    let fillHex = tryHex(body, `color-${fill}`);
    let source = 'pinned';
    // Optional pin: if the skin omits it and the pair can derive, mirror the
    // colors.css fallback exactly rather than reporting it missing.
    if (!fillHex && deriveFrom) {
      const base = tryHex(body, `color-${deriveFrom}`);
      if (base) { fillHex = darkenOklab(base, keep); source = `derived from --color-${deriveFrom}`; }
    }
    const contentHex = tryHex(body, `color-${content}`);
    if (!fillHex || !contentHex) {
      ok = false;
      console.log(`  [FAIL] --color-${(!fillHex ? fill : content).padEnd(18)} ${MISSING}`);
      console.log(`         ${note}`);
      continue;
    }
    const ratio = contrast(fillHex, contentHex);
    const failed = gate !== null && ratio < gate;
    if (failed) ok = false;
    const glyph = gate === null ? 'INFO' : failed ? 'FAIL' : 'PASS';
    const bar = gate === null ? 'not gated' : `gate ${gate}:1`;
    console.log(`  [${glyph}] --color-${content.padEnd(18)} ${contentHex} on ${fillHex} (${source})  ${ratio.toFixed(2)}:1  ${bar}`);
    console.log(`         ${note}`);
  }

  console.log(`\n${t.name} — accents on the base surfaces (no fill of their own)`);
  for (const { token, gate, note } of ON_SURFACE) {
    const hex = tryHex(body, `color-${token}`);
    if (!hex) {
      ok = false;
      console.log(`  [FAIL] --color-${token.padEnd(18)} ${MISSING}`);
      console.log(`         ${note}`);
      continue;
    }
    const ratios = surfaces.map(([n, s]) => [n, contrast(hex, s)]);
    const failed = gate !== null && ratios.some(([, r]) => r < gate);
    if (failed) ok = false;
    const glyph = gate === null ? 'INFO' : failed ? 'FAIL' : 'PASS';
    const bar = gate === null ? 'not gated' : `gate ${gate}:1`;
    const detail = ratios.map(([n, r]) => `${n} ${r.toFixed(2)}:1`).join('  ');
    console.log(`  [${glyph}] --color-${token.padEnd(18)} ${hex}  ${detail}  ${bar}`);
    console.log(`         ${note}`);
  }

  // Fallback safety net — gated on EVERY run, even when --color-error-fill is
  // pinned. A pinned skin never exercises the oklab fallback, so without this a
  // broken derivation would ship silently and only surface for the first skin
  // that omits the pin. This asserts the net actually catches --color-error.
  const errHex = tryHex(body, 'color-error');
  const errContent = tryHex(body, 'color-error-content');
  if (errHex && errContent) {
    const derived = darkenOklab(errHex, FILL_FALLBACK_KEEP);
    const ratio = contrast(derived, errContent);
    const failed = ratio < 4.5;
    if (failed) ok = false;
    console.log(`\n${t.name} — --danger-fill fallback (used when a skin omits --color-error-fill)`);
    console.log(`  [${failed ? 'FAIL' : 'PASS'}] color-mix 85%      ${errContent} on ${derived}  ${ratio.toFixed(2)}:1  gate 4.5:1`);
    console.log(`         derived from --color-error ${errHex} by darkening in oklab`);
  }
}

console.log(ok ? '\nText contrast OK — every gated level clears its bar in both themes.\n' : '\nText contrast FAILED — fix the marked levels.\n');
process.exit(ok ? 0 : 1);
