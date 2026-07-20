/* Forbids Tailwind arbitrary values that carry a raw literal anywhere under
 * frameworks/. This is the machine form of the rule CLAUDE.md states in
 * prose: the Tailwind layer derives every utility from an existing token and
 * introduces no new hex and no new value.
 *
 * Keyed on bracket syntax, never on `px` anywhere: a JSX inline style is a
 * different idiom and needs a different gate. check-dimension-literals.mjs
 * covers it, and the two are complements — one gate spanning both would be
 * keyed on nothing coherent.
 *
 * Legal inside the brackets — three shapes, and nothing else:
 *   - a value in a unit the token layer does not model — max-w-[42ch],
 *     max-w-[92vw], w-[62%], rotate-[120deg]. There is no token to
 *     reference and DTCG cannot express one, so the literal is the truth.
 *   - content with no value in it at all — transition-[background,transform],
 *     bg-[currentColor], rounded-[inherit].
 *   - one or more var(--token)s, alone or composed into a derivation:
 *     border-[length:var(--bw)], text-[length:calc(var(--avatar-md)*0.4)],
 *     shadow-[inset_0_calc(var(--bw-strong)*-1)_0_var(--crimson)].
 *
 * `.md` is scanned too, with one legal escape. A `.prompt.md`'s Don't block
 * or a doc's counterexample genuinely needs to show a bad class, and flagging
 * it would push authors to stop writing Don'ts — so a `.md` file may carry an
 * HTML comment naming exactly the classes it exempts:
 *
 *   <!-- check-arbitrary-values allow: text-[13px] bg-[#b52a20] -->
 *
 * It is invisible in rendered markdown, applies to the whole file it appears
 * in, and exempts only the exact class strings it lists — a class the file
 * carries but no marker names still fails, which is the point: adding a new
 * counterexample requires consciously listing it. A marker naming a class
 * that does not appear in the file fails too, as a stale allowance, the same
 * discipline check-tailwind-coverage.mjs applies to EXCLUDED. The marker is
 * honoured in `.md` only; found in any other extension, it is itself a
 * failure — there is no legitimate counterexample case outside prose.
 *
 *   bun scripts/check-arbitrary-values.mjs   -> exit 0 if none, 1 otherwise
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';
import { UNMODELLED_UNITS } from './check-dimension-literals.mjs';

const EXTENSIONS = ['.json', '.ts', '.tsx', '.jsx', '.html', '.md'];
const CANDIDATE = /(?<![\w-])(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[([^\]\s"']+)\])/g;
const MARKER = /<!--\s*check-arbitrary-values allow:\s*([^>]*?)\s*-->/g;

/** An optional CSS type hint Tailwind allows in front of a bracket's value. */
const HINT = /^(?:length|color|number|percentage|integer|angle|time|url|image|family-name):/;
/** A var() into a token — the atom every legal bracket is built from. */
const TOKEN = /var\(\s*--[a-z0-9-]+\s*\)/g;
/** A single value in a unit the token layer does not model. */
const UNMODELLED = new RegExp(`^-?\\d*\\.?\\d+(?:${UNMODELLED_UNITS.join('|')})$`);
/** A number carrying a unit — judged against UNMODELLED_UNITS, not a denylist. */
const UNIT_LITERAL = /\d*\.?\d+\s*([a-z%]+)\b(?!\()/g;
/** Zero, in the forms a bracket writes it. */
const ZERO_RUN = /(?<![\w.])-?0(?:px|rem|em|%)?(?![\w.])/g;
/** A bare number left over once every token and zero has been stripped —
 *  judged one match at a time against insideMathParens below, never against
 *  the bracket as a whole. */
const BARE_NUMBER = /(?<![\w.])-?\d*\.?\d+(?![\w.%])/g;
/** True when the text immediately before a `(` is one of the math
 *  functions — used to tell a math call's own parens from an unrelated
 *  pair (there are none in a legal bracket today, but the check is by
 *  identifier, not by "any paren", so it stays correct if one ever appears). */
const MATH_OPEN = /\b(?:calc|min|max|clamp)$/;

/** Is the character at `rest[index]` nested inside a calc()/min()/max()/
 *  clamp() call's parentheses — the only place a bare number is a
 *  multiplier rather than a value?
 *
 *  A first version of this rule tested `MATH.test(value)` once for the
 *  whole bracket, so `z-[calc(var(--z-modal))_900]` passed: the bracket
 *  contains a `calc(`, so the leftover `900` — which sits *after* that
 *  calc's own closing paren, no longer inside it — was waved through as if
 *  it were one of the multipliers calc() actually carries. This walks the
 *  text up to `index`, tracking paren depth and, per frame, whether the
 *  paren that opened it was itself a math function's, so a number is only
 *  legal when the innermost enclosing frame at its own position is math.
 *  @param {string} rest @param {number} index @returns {boolean} */
function insideMathParens(rest, index) {
  const stack = []; // one entry per currently-open paren; true if math's
  for (let i = 0; i < index; i++) {
    if (rest[i] === '(') stack.push(MATH_OPEN.test(rest.slice(0, i)));
    else if (rest[i] === ')') stack.pop();
  }
  return stack.length > 0 && stack[stack.length - 1];
}

/** Is this bracket's content legal?
 *
 *  Three shapes are, and nothing else:
 *    1. a value in a unit the token layer does not model — max-w-[42ch],
 *       max-w-[92vw], w-[62%], rotate-[120deg]. There is no token to
 *       reference and DTCG cannot express one, so the literal is the truth.
 *    2. content with no value in it at all — transition-[background,transform],
 *       bg-[currentColor], rounded-[inherit].
 *    3. one or more var(--token)s, alone or composed into a derivation:
 *       border-[length:var(--bw)], text-[length:calc(var(--avatar-md)*0.4)],
 *       shadow-[inset_0_calc(var(--bw-strong)*-1)_0_var(--crimson)].
 *       "Composed" means what CLAUDE.md's rule means: after removing every
 *       token, what is left may be operators, zeros, and multipliers inside a
 *       math function — never a dimension in a unit we model, never a hex, and
 *       never a bare number standing on its own (z-[900] is not a derivation).
 *
 *  Tailwind writes spaces as underscores inside a bracket, so they are
 *  normalised before any of this is judged.
 *  @param {string} content the text between the brackets
 *  @returns {boolean} */
export function isLegalBracket(content) {
  const value = content.replace(HINT, '').replaceAll('_', ' ');
  if (UNMODELLED.test(value.trim())) return true;
  if (!/[\d#]/.test(value)) return true;
  if (value.includes('#')) return false;
  if (!TOKEN.test(value)) return false;
  TOKEN.lastIndex = 0;

  const rest = value.replace(TOKEN, ' ').replace(ZERO_RUN, ' ');
  for (const m of rest.matchAll(UNIT_LITERAL))
    if (!UNMODELLED_UNITS.includes(m[1])) return false;
  // A bare number left over is a multiplier only when IT ITSELF sits inside
  // calc()/min()/max()/clamp()'s own parens — checked position by position,
  // not once for the bracket as a whole (see insideMathParens above).
  for (const m of rest.matchAll(BARE_NUMBER))
    if (!insideMathParens(rest, m.index)) return false;
  return true;
}

/** @param {string} text @returns {{cls: string, content: string}[]} */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const [, cls, content] = m;
    if (isLegalBracket(content)) continue;
    out.push({ cls, content });
  }
  return out;
}

/** Every check-arbitrary-values marker in `text`, in source order.
 *  @param {string} text @returns {{raw: string, classes: string[]}[]} */
export function findMarkers(text) {
  return [...text.matchAll(MARKER)].map((m) => ({
    raw: m[0],
    classes: m[1].trim().split(/\s+/).filter(Boolean),
  }));
}

/** The class strings every marker in `text` allows, unioned.
 *  @param {string} text @returns {Set<string>} */
export function markerAllowlist(text) {
  const out = new Set();
  for (const { classes } of findMarkers(text)) for (const cls of classes) out.add(cls);
  return out;
}

/** Scan one file's content, applying the `.md` marker escape when `isMarkdown`.
 *  @param {string} relPath repo-relative path, used only for messages and to
 *    reject a marker found outside `.md`
 *  @param {string} text
 *  @returns {string[]} one message per violation, empty when clean */
export function scanFile(relPath, text) {
  const isMarkdown = relPath.endsWith('.md');
  const markers = findMarkers(text);
  const errs = [];

  if (markers.length && !isMarkdown)
    errs.push(`${relPath}: check-arbitrary-values marker is only honoured in .md files`);

  // The marker's own text names the classes it exempts, so it necessarily
  // contains their literal bracket syntax — scanning it as content would make
  // every allowance self-satisfying (never stale) and double-count a class
  // that also appears for real elsewhere. Strip the marker comments first;
  // the allowlist itself is still read from the untouched original text.
  const withoutMarkers = markers.length ? text.replace(MARKER, '') : text;
  const candidates = scanText(withoutMarkers);
  const allowed = isMarkdown ? markerAllowlist(text) : new Set();

  for (const { cls } of candidates)
    if (!allowed.has(cls)) errs.push(`${relPath}: \`${cls}\` — a raw value, not a token`);

  if (isMarkdown) {
    const flagged = new Set(candidates.map((c) => c.cls));
    for (const cls of allowed)
      if (!flagged.has(cls))
        errs.push(`${relPath}: stale allowance \`${cls}\` — does not appear as a raw value in the file`);
  }

  return errs;
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) yield p;
  }
}

function main() {
  const root = join(repoRoot, 'frameworks');
  const errs = [];
  let scanned = 0;
  for (const file of walk(root)) {
    scanned++;
    errs.push(...scanFile(relative(repoRoot, file), readFileSync(file, 'utf8')));
  }
  if (errs.length) {
    console.error(`check-arbitrary-values: ${errs.length} problem(s) under frameworks/\n`);
    for (const e of errs) console.error(`  ${e}`);
    console.error('\nExpose the token in frameworks/tailwind/theme.css and use the utility, or reference the token as var(--name). In .md, exempt a genuine counterexample with a check-arbitrary-values marker naming it.');
    process.exit(1);
  }
  console.log(`check-arbitrary-values: ${scanned} file(s) scanned, none`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
