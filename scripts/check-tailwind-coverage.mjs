/* Asserts every Arena token either reaches a Tailwind utility or is excluded
 * on the record. A token added to tokens/src/ that nobody wires into the
 * preset fails here rather than quietly never reaching the Tailwind layer.
 *
 * The inventory is the four GENERATED files only. tokens/colors.css is
 * excluded as a category: those ~40 composition-layer aliases (--crimson,
 * --mute, --danger-soft, --text-strong…) alias tokens the preset already
 * exposes, and giving every colour two utility names would give it two ways
 * to be wrong. --picker-invert, also in that file, belongs to a second
 * category — not expressible as a utility — which is what keeps the four
 * charts and Calendar out of this layer too.
 *
 *   bun scripts/check-tailwind-coverage.mjs   -> exit 0 if declared, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { arenaTokens } from './check-tailwind.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';

/** Tokens deliberately not exposed, and why. Adding an entry here is a design
 *  decision; the gate only asserts the entry is honest. */
export const EXCLUDED = new Map([
  ['sp-0', 'p-0 compiles to a literal 0px in v4 regardless of the theme'],
  ['bp-sm', 'read by JS through getComputedStyle, never a media query'],
  ['bp-md', 'read by JS through getComputedStyle, never a media query'],
  ['bp-lg', 'read by JS through getComputedStyle, never a media query'],
  ['dur-fast', 'v4 has no duration namespace; wired as --default-transition-duration'],
  ['dur-mid', 'v4 has no duration namespace; reached as duration-[var(--dur-mid)]'],
  ['dur-slow', 'v4 has no duration namespace; no consumer today, available as duration-[var(--dur-slow)]'],
  ['loop-spin', 'v4 has no duration namespace; reached as duration-[var(--loop-spin)]'],
  ['loop-sweep', 'v4 has no duration namespace; reached as duration-[var(--loop-sweep)]'],
  ['loop-shimmer', 'v4 has no duration namespace; reached as duration-[var(--loop-shimmer)]'],
  ['loop-brand', 'v4 has no duration namespace; reached as duration-[var(--loop-brand)]'],
  ['loop-reduced', 'v4 has no duration namespace; the reduced-motion step, set inside a media query rather than by a utility'],
  ['loop-brand-reduced', 'v4 has no duration namespace; the reduced-motion step, set inside a media query rather than by a utility'],
  ['bw', 'v4 has no border-width namespace; reached as border-[length:var(--bw)]'],
  ['bw-strong', 'v4 has no border-width namespace; no consumer today, available as border-[length:var(--bw-strong)]'],
  ['focus-width', 'no namespace — the focus ring is composed, not a single utility'],
  ['focus-offset', 'no namespace — the focus ring is composed, not a single utility'],
  ['chart-height', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-top', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-right', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-bottom', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-pad-left', 'script-readable: JS computes SVG positions from it, never a utility'],
  ['chart-bar-radius', 'script-readable: passed to barPath(), which builds an SVG path string'],
  ['chart-bar-gap', 'script-readable: subtracted from the per-bar step width'],
  ['chart-point-r', 'script-readable: an SVG circle r attribute computed per point'],
  ['chart-point-r-hover', 'script-readable: an SVG circle r attribute computed per point'],
  ['chart-legend-min', 'script-readable: a clamp bound compared against a measured width'],
  ['chart-legend-max', 'script-readable: a clamp bound compared against a measured width'],
  ['chart-legend-gap', 'script-readable: subtracted from a measured width to size the plot'],
  ['calendar-hour-h', 'script-readable: JS projects a minute-of-day onto a pixel offset from it'],
  ['onboarding-width', 'script-readable: compared against window.innerWidth by Math.min/Math.max. Rendered directly as var(--onboarding-width) in both layers — React inline, Angular via the shared manifest\'s w-[var(--onboarding-width)] — never through the @theme spacing scale this gate checks'],
]);

/** The Arena token names a preset's @theme block references.
 *  @param {string} css @returns {Set<string>} */
export function presetTokens(css) {
  const out = new Set();
  const m = css.match(/@theme\s*\{([\s\S]*)\}/);
  if (!m) return out;
  // Strip /* ... */ comments before splitting on `;`. A comment that sits
  // between two declarations shares its semicolon-delimited chunk with the
  // following declaration (there is no `;` of its own), so left in place its
  // text gets prepended to that declaration's key and fails the `--` check
  // below — silently dropping a token the preset does expose. Comments can
  // also contain a stray `:` or `;` of their own (the spacing block's
  // comment mentions `calc(var(--spacing) * N)` and `0.25rem`), so a per-line
  // removal would not be enough; the whole comment, however many lines it
  // spans, has to go first.
  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '');
  for (const line of body.split(';')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    // --default-* wires a Tailwind default to a token; it is not a utility
    // surface, so it does not count as exposing that token. --dur-fast is
    // reached that way and stays in EXCLUDED for exactly that reason.
    if (!key.startsWith('--') || key.startsWith('--default-')) continue;
    const ref = line.slice(i + 1).match(/^\s*var\(--([a-z0-9-]+)\)\s*$/);
    if (ref) out.add(ref[1]);
  }
  return out;
}

/** @param {Set<string>} tokens @param {Set<string>} exposed @param {Map<string,string>} excluded
 *  @returns {string[]} violations */
export function checkCoverage(tokens, exposed, excluded) {
  const errs = [];
  for (const t of [...tokens].sort()) {
    const isExposed = exposed.has(t);
    const isExcluded = excluded.has(t);
    if (isExposed && isExcluded) errs.push(`--${t} is both exposed and excluded — drop the exclusion`);
    else if (!isExposed && !isExcluded)
      errs.push(`--${t} reaches no Tailwind utility — expose it in frameworks/tailwind/theme.css or add it to EXCLUDED with a reason`);
  }
  for (const t of [...excluded.keys()].sort())
    if (!tokens.has(t)) errs.push(`--${t} is excluded but no such token exists — drop the exclusion`);
  for (const t of [...exposed].sort())
    if (!tokens.has(t)) errs.push(`the preset references --${t} — no such token in tokens/`);
  return errs;
}

function main() {
  const tokens = arenaTokens();
  const preset = readFileSync(join(repoRoot, 'frameworks/tailwind/theme.css'), 'utf8');
  const exposed = presetTokens(preset);
  const errs = checkCoverage(tokens, exposed, EXCLUDED);
  if (errs.length) {
    console.error(`check-tailwind-coverage: ${errs.length} token(s) undeclared\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-tailwind-coverage: ${tokens.size} token(s) — ${exposed.size} exposed, ${EXCLUDED.size} excluded on the record`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
