/* Fails on a bare dimension literal in a token-governed property anywhere under
 * frameworks/. This is the machine form of the rule CLAUDE.md states in prose:
 * a dimension in a framework layer is a token or a derivation of tokens, and a
 * bare literal is a bug.
 *
 * It is not a tidiness check. Zero bare literals means every rendered value
 * resolves from tokens/src/, which is exactly the claim that changing a value
 * there moves every layer. This gate is the proof of that promise.
 *
 * It is the complement of check-arbitrary-values.mjs: that one keys on
 * Tailwind's bracket syntax, this one on literals in inline style objects.
 * Together they close both idioms.
 *
 *   bun scripts/check-dimension-literals.mjs                 -> exit 0 if none, 1 otherwise
 *   bun scripts/check-dimension-literals.mjs --report        -> the census, grouped
 *   bun scripts/check-dimension-literals.mjs --report=sites  -> one line per site: file:line  prop: raw
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.jsx', '.ts', '.tsx'];

/** Properties whose value Arena's token layer governs. */
const PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing', 'fontWeight',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'gap', 'rowGap', 'columnGap',
  'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
  'borderWidth', 'borderRadius',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'inset', 'zIndex',
]);

/* Two correct sites look exactly like defects, so they are named rather than
 * inferred — the same discipline check-tailwind-coverage.mjs applies to its
 * token exclusions. Keyed "<path>:<prop>:<raw>". */
export const EXEMPT = new Map([
  ['frameworks/react/components/display/Calendar.jsx:zIndex:1',
   'local stacking inside a positioned container; does not join the global z order'],
]);

/** Units the token layer genuinely does not model, and that are legal
 *  wherever they appear — a closed allowlist, not an open denylist. A unit
 *  missing from this list fails closed: `em` was absent from every list
 *  here until a review caught it, and by then 34 tracking literals had
 *  gone unflagged. A unit nobody has thought of yet — `pt`, `cm`, a typo —
 *  gets the same treatment as `px`, not a silent pass. */
const FREE_UNITS = ['%', 'ch', 'fr', 'vh', 'vw', 'vmin', 'vmax', 'deg', 's', 'ms'];
const FREE_UNIT = new RegExp(`^\\s*'?-?\\d*\\.?\\d+(${FREE_UNITS.join('|')})'?\\s*$`);
/** A number immediately carrying a unit — a candidate dimension literal,
 *  judged against FREE_UNITS above rather than against a fixed "bad" list.
 *  No whitespace between the digits and the letters: CSS units never have
 *  one, so admitting one made a shorthand like `'0 calc(var(--sp-1) * 3)'`
 *  misread as `0 calc`, with "calc" itself standing in as a bogus unit —
 *  the zero and the derivation are two different values in the same
 *  shorthand, not one value with a gap in it. */
const UNIT_LITERAL = /\d*\.?\d+(%|[a-z]+)\b/g;
/** The whole value is a bare number (quoted or not). */
const BARE_NUMBER = /^\s*'?-?\d*\.?\d+'?\s*$/;
/** Zero, in the forms the layer writes it. */
const ZERO = /^\s*'?-?0(px|rem|em|%)?'?\s*$/;

/** @param {string} prop @param {string} raw
 *  @returns {{reason: string} | null} null when the value is legal */
export function scanValue(prop, raw) {
  if (!PROPS.has(prop)) return null;
  if (ZERO.test(raw)) return null;
  if (FREE_UNIT.test(raw)) return null;

  // A var() is a token. Remove every one, then judge what is left: a
  // multiplier inside calc() is not a literal, a unit is.
  const withoutTokens = raw.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, '');

  // A number carrying any unit is a dimension literal unless that unit is
  // on the free list above.
  for (const m of withoutTokens.matchAll(UNIT_LITERAL))
    if (!FREE_UNITS.includes(m[1]))
      return { reason: `a raw ${m[1]}, not a token` };

  // A bare number standing as the entire value asserts a dimension the
  // language never declared — fontSize: 13, zIndex: 1000, lineHeight: 1.
  if (!raw.includes('var(') && BARE_NUMBER.test(raw))
    return { reason: 'a bare number, not a token' };

  return null;
}

// The bareword alternative carries `%` alongside `-\w.`: without it a value
// like `left:-40%` inside CSS text (ProgressBar.jsx's injected keyframes
// string) is captured as `-40`, silently losing the unit that FREE_UNIT
// needs to recognise it as legal — a truncated capture, not a real bare
// number. Every other unit this gate treats as free (ch, fr, vh, vw, vmin,
// vmax, deg, s, ms) is already alphabetic and so already inside \w; `%` was
// the one character in FREE_UNIT's list that fell outside that class.
const DECL = /(?<![\w.])([a-zA-Z]+)\s*:\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.%]+)/g;

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]}
 *  `line` is 1-based, counted by newlines up to the match — it is what
 *  --report=sites and Task 3's classification pass locate a site by. */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(DECL)) {
    const [, prop, raw] = m;
    const hit = scanValue(prop, raw);
    if (hit) {
      const line = text.slice(0, m.index).split('\n').length;
      out.push({ prop, raw, reason: hit.reason, line });
    }
  }
  return out;
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) { yield* walk(p); continue; }
    // A .d.ts renders nothing at runtime -- there is no value here to be a
    // token or a literal. It would pass today by coincidence (TypeScript's
    // `prop?: type` breaks DECL on the `?`), which is the wrong reason for
    // a scanner whose job is to fail closed. Skipped explicitly instead.
    if (entry.endsWith('.d.ts')) continue;
    if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
  }
}

function collect() {
  const found = [];
  for (const file of walk(join(repoRoot, 'frameworks'))) {
    const rel = relative(repoRoot, file);
    for (const hit of scanText(readFileSync(file, 'utf8'))) {
      if (EXEMPT.has(`${rel}:${hit.prop}:${hit.raw}`)) continue;
      found.push({ file: rel, ...hit });
    }
  }
  return found;
}

/** The census: every violation grouped by property, then by value, with the
 *  files that carry it. This output is the authority for the classification
 *  pass — the spec's own counts are indicative and are superseded by it. */
function report(found) {
  const byProp = new Map();
  for (const f of found) {
    if (!byProp.has(f.prop)) byProp.set(f.prop, new Map());
    const byValue = byProp.get(f.prop);
    if (!byValue.has(f.raw)) byValue.set(f.raw, []);
    byValue.get(f.raw).push(f.file);
  }
  for (const [prop, byValue] of [...byProp].sort((a, b) => a[0].localeCompare(b[0]))) {
    const total = [...byValue.values()].reduce((n, files) => n + files.length, 0);
    console.log(`\n${prop}  (${total} site(s), ${byValue.size} distinct value(s))`);
    for (const [raw, files] of [...byValue].sort((a, b) => b[1].length - a[1].length))
      console.log(`  ${String(files.length).padStart(3)}x  ${raw}`);
  }
  console.log(`\ntotal: ${found.length} site(s)`);
}

/** One line per violation: file:line  prop: raw. The grouped report answers
 *  what to fix; this answers where — Task 3 assigns each of these to a
 *  family, and the eleven editing tasks after it need to find the exact
 *  line rather than re-deriving it through scanText by hand. Exactly one
 *  line per site, nothing else, so a plain line count is the site count. */
function reportSites(found) {
  const sorted = [...found].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  for (const f of sorted) console.log(`${f.file}:${f.line}  ${f.prop}: ${f.raw}`);
}

function main() {
  const found = collect();
  if (process.argv.includes('--report=sites')) { reportSites(found); return; }
  if (process.argv.includes('--report')) { report(found); return; }
  if (found.length) {
    console.error(`check-dimension-literals: ${found.length} bare literal(s) under frameworks/\n`);
    for (const f of found) console.error(`  ${f.file}: ${f.prop}: ${f.raw} — ${f.reason}`);
    console.error('\nA dimension is a token or a derivation of tokens. Use var(--token), or');
    console.error('calc() over one where the scale is numeric. If neither fits, the token is');
    console.error('what is missing — add it to tokens/src/ first.');
    process.exit(1);
  }
  console.log('check-dimension-literals: no bare literals under frameworks/');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
