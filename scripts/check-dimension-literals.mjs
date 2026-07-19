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
  ['frameworks/react/components/display/Avatar.jsx:fontSize:d * 0.4',
   'a ratio scaling the initials with the avatar\'s own diameter, not a dimension — the rule governs dimensions, not the multiplier that derives one instance from another'],
  ['frameworks/react/components/brand/Rotor.jsx:width:48',
   'Dravensoft\'s brand mark; the source spec is explicit that brand assets are not themeable, and the same logic covers its size — fixing it to a token would quietly make the mark resizable by a re-skin'],
  ['frameworks/react/ui_kits/console/Shell.jsx:width:30',
   'Rotor call site — brand mark, not themeable, see Rotor.jsx\'s own exemption'],
  ['frameworks/react/ui_kits/console/LoginScreen.jsx:width:40',
   'Rotor call site — brand mark, not themeable, see Rotor.jsx\'s own exemption'],
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
 *  Whitespace between the digits and the letters is allowed here — CSS
 *  itself never has one, so `'4 px'` is not a legal length, it is a typo
 *  for `'4px'` that still asserts a bare dimension and must still fail.
 *  What whitespace must not do is let a *function name* stand in as a
 *  bogus unit: a naive `\d+\s*[a-z]+` reads `'0 calc(var(--sp-1) * 3)'` as
 *  `0` + unit `calc`, when "0" and the calc() are two different values in
 *  the same shorthand, not one value with a gap in it. The `(?!\()` guard
 *  is what tells the two apart — a real unit is never followed by `(`,
 *  only a function call is, so excluding that one shape keeps `calc(`,
 *  `min(`, `max(`, `rgba(` and friends from ever being misread as a unit
 *  while still catching a spaced-out `px`, `pt`, `em`. */
const UNIT_LITERAL = /\d*\.?\d+\s*(%|[a-z]+)\b(?!\()/g;
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

/** `prop: cond ? branchA : branchB` — DECL alone stops at the condition
 *  (`on`, `showLabel`, `i`), which is never itself a literal, so a ternary
 *  hides whichever branch IS one. Both branches are judged independently:
 *  `fontWeight: on ? 600 : 400` is two violations in the same shorthand,
 *  `width: full ? '100%' : 'auto'` is legal on both sides. The condition
 *  itself is deliberately unconstrained (`[^,{}?:]+?`) — it is anything
 *  from a bare identifier (`on`) to a comparison (`idx === i`) — because
 *  the gate does not need to understand the condition, only find where it
 *  ends. A condition folded inside a string concatenation
 *  (`'var(--bw) solid ' + (cond ? 'a' : 'b')`) also matches this loosely,
 *  which is harmless: both branches there are always token references and
 *  scanValue passes them, so the extra match costs nothing. */
const TERNARY = /(?<![\w.])([a-zA-Z]+)\s*:\s*[^,{}?:]+?\?\s*('[^']*'|"[^"]*"|`[^`]*`|[^:,}]+?)\s*:\s*('[^']*'|"[^"]*"|`[^`]*`|[^,}]+?)\s*(?=[,}])/g;

/** `prop: ident * 0.4` — the entire value is an arithmetic expression, not
 *  a `var()`/`calc()` derivation and not a plain literal, so neither DECL
 *  nor scanValue's own bare-number path ever sees the number inside it.
 *  The leading term is an identifier (optionally a.b member chain) with an
 *  *optional* single-level call suffix — `y(m) - 5` and `yOf(values[hover])
 *  - 8` are the same shape as `d * 0.4`, just with a call standing in for
 *  the plain identifier, so the same regex covers both by making that
 *  suffix optional rather than adding a second pattern for it. Nested
 *  parens inside the call are deliberately unsupported (`[^()]*`, one
 *  level only) — every real site is a single flat call, and a second
 *  parenthesised layer would need genuine parsing, not a wider class. */
const ARITH = /(?<![\w.])([a-zA-Z]+)\s*:\s*([a-zA-Z_$][\w.$]*(?:\([^()]*\))?\s*[*+/-]\s*-?\d*\.?\d+)\s*(?=[,}])/g;

/** `prop: Math.max(8, d * 0.28)` — the entire value is a call, and DECL's
 *  bareword capture stops at the callee name (`Math.max`), never reaching
 *  the arguments. Unlike ARITH above, a call is not unconditionally a
 *  violation — `height: y(endMin)` is a legal derived value with no
 *  literal in it — so each top-level argument is judged on its own via
 *  scanValue: `8` is a bare number and fails, `d * 0.28` contains an
 *  identifier and is left alone the same way `d * 0.4` would be if it
 *  stood alone. Bounded to one call, no trailing arithmetic after the
 *  closing paren (that shape is ARITH's, above) and no nested parens in
 *  the argument list, for the same reason ARITH stays single-level. */
const CALL = /(?<![\w.])([a-zA-Z]+)\s*:\s*([a-zA-Z_$][\w.$]*)\(([^()]*)\)\s*(?=[,}])/g;

/** Splits a call's argument list on top-level commas, tracking `[`/`]`
 *  depth so a bracketed index like `values[hover]` (no comma inside it in
 *  practice, but defensive regardless) never causes a false split. Parens
 *  are already excluded from the input by CALL's own `[^()]*`. */
function splitArgs(text) {
  const args = [];
  let depth = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '[') depth++;
    else if (c === ']') depth--;
    else if (c === ',' && depth === 0) { args.push(text.slice(start, i)); start = i + 1; }
  }
  args.push(text.slice(start));
  return args.map((a) => a.trim()).filter((a) => a.length > 0);
}

/** @param {string} text @param {number} index
 *  @returns {number} 1-based line, counted by newlines up to `index`. */
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]}
 *  `line` is 1-based, counted by newlines up to the match — it is what
 *  --report=sites and Task 3's classification pass locate a site by. */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(DECL)) {
    const [, prop, raw] = m;
    const hit = scanValue(prop, raw);
    if (hit) out.push({ prop, raw, reason: hit.reason, line: lineOf(text, m.index) });
  }
  for (const m of text.matchAll(TERNARY)) {
    const [, prop, branchA, branchB] = m;
    if (!PROPS.has(prop)) continue;
    const line = lineOf(text, m.index);
    for (const raw of [branchA, branchB]) {
      const hit = scanValue(prop, raw);
      if (hit) out.push({ prop, raw, reason: hit.reason, line });
    }
  }
  for (const m of text.matchAll(ARITH)) {
    const [, prop, raw] = m;
    if (!PROPS.has(prop)) continue;
    const line = lineOf(text, m.index);
    out.push({ prop, raw, reason: 'an inline literal in an arithmetic expression, not a token', line });
  }
  for (const m of text.matchAll(CALL)) {
    const [, prop, , argsText] = m;
    if (!PROPS.has(prop)) continue;
    const line = lineOf(text, m.index);
    for (const arg of splitArgs(argsText)) {
      const hit = scanValue(prop, arg);
      if (hit) out.push({ prop, raw: arg, reason: hit.reason, line });
    }
  }
  return out;
}

/** A prop name that is not itself a governed CSS property, but that a named
 *  component assigns unmodified into one, one line away, in the same file
 *  — verified by reading the component, not inferred. This is deliberately
 *  a short, hand-curated list rather than a scan of every JSX attribute on
 *  every element: a generic scan cannot tell `<Icon size={16} />` (a
 *  rendered dimension) from `<Textarea rows={3} />` or `<input
 *  maxLength={20} />` (ordinary numeric props Arena's token layer has no
 *  opinion about) without the same "does this actually reach a governed
 *  CSS property" read this map already encodes by name. Growing this list
 *  costs the same review Calendar's zIndex EXEMPT entry costs — it is not
 *  free, and that is the point. */
const PASSTHROUGH = new Map([
  ['Icon', { prop: 'size', governs: 'fontSize' }],
  ['Rotor', { prop: 'size', governs: 'width' }],
]);

/** A component's own default value for a passthrough prop or for a prop
 *  that is itself a governed CSS property name — `function Icon({ size =
 *  18 })` and `function Dialog({ width = 480 })` are the same blind spot:
 *  DECL requires `:`, and a destructured default uses `=`. Scoped to the
 *  text between a function's `({` and the matching `}) {` so a plain
 *  variable assignment elsewhere in the file (`const top = Math.min(...)`)
 *  is never in scope — only the parameter list itself is. */
const COMPONENT_PARAMS = /function\s+([A-Za-z_]\w*)\s*\(\{([\s\S]*?)\}\)\s*\{/g;
const PARAM_DEFAULT = /(?<![\w.])([a-zA-Z]+)\s*=\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.%]+)(?=[,\s]|$)/g;

/** @param {string} text
 *  @returns {{prop: string, raw: string, reason: string, line: number}[]} */
export function scanDefaultsAndCallSites(text) {
  const out = [];
  for (const fn of text.matchAll(COMPONENT_PARAMS)) {
    const [, name, params] = fn;
    const paramsStart = fn.index + fn[0].indexOf('{');
    const via = PASSTHROUGH.get(name);
    for (const m of params.matchAll(PARAM_DEFAULT)) {
      const [, prop, raw] = m;
      const governs = PROPS.has(prop) ? prop : (via && via.prop === prop ? via.governs : null);
      if (!governs) continue;
      const hit = scanValue(governs, raw);
      if (hit) out.push({ prop: governs, raw, reason: hit.reason, line: lineOf(text, paramsStart + m.index) });
    }
  }
  for (const [name, via] of PASSTHROUGH) {
    const re = new RegExp(`<${name}\\b[^>]*?\\b${via.prop}\\s*=\\s*\\{([^}]+)\\}`, 'g');
    for (const m of text.matchAll(re)) {
      const raw = m[1].trim();
      const hit = scanValue(via.governs, raw);
      if (hit) out.push({ prop: via.governs, raw, reason: hit.reason, line: lineOf(text, m.index) });
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

/** @param {Set<string>} matchedKeys — every `<path>:<prop>:<raw>` a scan
 *  actually produced this run, before EXEMPT filtering.
 *  @returns {string[]} EXEMPT keys that matched nothing — a named
 *  exemption for a site that no longer produces a violation, because it
 *  was fixed, deleted, or its raw text changed shape. Named exemptions
 *  are only honest if a stale one is loud: `EXEMPT` is how `Calendar`'s
 *  local `zIndex`, `Avatar`'s ratio, and `Rotor`'s brand-mark size stay
 *  legal on purpose, and the same map going quietly out of date would let
 *  a real regression hide behind an entry nobody is reading anymore. */
export function staleExemptions(matchedKeys) {
  return [...EXEMPT.keys()].filter((k) => !matchedKeys.has(k));
}

function collect() {
  const found = [];
  const matchedKeys = new Set();
  for (const file of walk(join(repoRoot, 'frameworks'))) {
    const rel = relative(repoRoot, file);
    const text = readFileSync(file, 'utf8');
    for (const hit of [...scanText(text), ...scanDefaultsAndCallSites(text)]) {
      const key = `${rel}:${hit.prop}:${hit.raw}`;
      matchedKeys.add(key);
      if (EXEMPT.has(key)) continue;
      found.push({ file: rel, ...hit });
    }
  }
  return { found, stale: staleExemptions(matchedKeys) };
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
  const { found, stale } = collect();
  if (process.argv.includes('--report=sites')) { reportSites(found); return; }
  if (process.argv.includes('--report')) { report(found); return; }
  let failed = false;
  if (stale.length) {
    failed = true;
    console.error(`check-dimension-literals: ${stale.length} stale EXEMPT entr${stale.length === 1 ? 'y' : 'ies'} — named a site that no longer produces a violation\n`);
    for (const key of stale) console.error(`  ${key} — ${EXEMPT.get(key)}`);
    console.error('\nThe site was fixed, deleted, or its raw text changed shape. Remove the');
    console.error('entry, or re-key it to match the current text exactly.');
  }
  if (found.length) {
    failed = true;
    if (stale.length) console.error('');
    console.error(`check-dimension-literals: ${found.length} bare literal(s) under frameworks/\n`);
    for (const f of found) console.error(`  ${f.file}: ${f.prop}: ${f.raw} — ${f.reason}`);
    console.error('\nA dimension is a token or a derivation of tokens. Use var(--token), or');
    console.error('calc() over one where the scale is numeric. If neither fits, the token is');
    console.error('what is missing — add it to tokens/src/ first.');
  }
  if (failed) process.exit(1);
  console.log('check-dimension-literals: no bare literals under frameworks/, no stale exemptions');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
