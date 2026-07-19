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
 *   bun scripts/check-dimension-literals.mjs            -> exit 0 if none, 1 otherwise
 *   bun scripts/check-dimension-literals.mjs --report   -> the census, grouped
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

/** A length literal: a number carrying a unit the token layer owns. */
const RAW_LENGTH = /\d*\.?\d+\s*(px|rem)\b/;
/** Units the layer legitimately uses and the token layer does not model. */
const FREE_UNIT = /^\s*'?-?\d*\.?\d+(%|ch|fr|vh|vw|vmin|vmax|deg|s|ms)'?\s*$/;
/** The whole value is a bare number (quoted or not). */
const BARE_NUMBER = /^\s*'?-?\d*\.?\d+'?\s*$/;
/** Zero, in the forms the layer writes it. */
const ZERO = /^\s*'?-?0(px|rem|%)?'?\s*$/;

/** @param {string} prop @param {string} raw
 *  @returns {{reason: string} | null} null when the value is legal */
export function scanValue(prop, raw) {
  if (!PROPS.has(prop)) return null;
  if (ZERO.test(raw)) return null;
  if (FREE_UNIT.test(raw)) return null;

  // A var() is a token. Remove every one, then judge what is left: a
  // multiplier inside calc() is not a literal, a px is.
  const withoutTokens = raw.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, '');
  if (RAW_LENGTH.test(withoutTokens))
    return { reason: 'a raw length, not a token' };

  // A bare number standing as the entire value asserts a dimension the
  // language never declared — fontSize: 13, zIndex: 1000, lineHeight: 1.
  if (!raw.includes('var(') && BARE_NUMBER.test(raw))
    return { reason: 'a bare number, not a token' };

  return null;
}

const DECL = /(?<![\w.])([a-zA-Z]+)\s*:\s*('[^']*'|"[^"]*"|`[^`]*`|[-\w.]+)/g;

/** @param {string} text @returns {{prop: string, raw: string, reason: string}[]} */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(DECL)) {
    const [, prop, raw] = m;
    const hit = scanValue(prop, raw);
    if (hit) out.push({ prop, raw, reason: hit.reason });
  }
  return out;
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
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

function main() {
  const found = collect();
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
