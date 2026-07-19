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
 * Legal inside the brackets:
 *   - a var() into a token, optionally behind a type hint —
 *     h-[var(--dz-ctl-h)], border-[length:var(--bw)]
 *   - content with no literal value in it at all —
 *     transition-[background,transform,box-shadow], bg-[currentColor]
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

const EXTENSIONS = ['.json', '.ts', '.tsx', '.jsx', '.html', '.md'];
const CANDIDATE = /(?<![\w-])(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[([^\]\s"']+)\])/g;
const TOKEN_REF = /^(?:length:|color:|number:|percentage:)?var\(--[a-z0-9-]+\)$/;
const MARKER = /<!--\s*check-arbitrary-values allow:\s*([^>]*?)\s*-->/g;

/** @param {string} text @returns {{cls: string, content: string}[]} */
export function scanText(text) {
  const out = [];
  for (const m of text.matchAll(CANDIDATE)) {
    const [, cls, content] = m;
    if (TOKEN_REF.test(content)) continue;
    if (!/[\d#]/.test(content)) continue; // a keyword or a property list, not a value
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
