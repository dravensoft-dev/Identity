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
 *   bun scripts/check-arbitrary-values.mjs   -> exit 0 if none, 1 otherwise
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const EXTENSIONS = ['.json', '.ts', '.tsx', '.jsx', '.html'];
const CANDIDATE = /(?<![\w-])(-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[([^\]\s"']+)\])/g;
const TOKEN_REF = /^(?:length:|color:|number:|percentage:)?var\(--[a-z0-9-]+\)$/;

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
    for (const { cls } of scanText(readFileSync(file, 'utf8')))
      errs.push(`${relative(repoRoot, file)}: \`${cls}\` — a raw value, not a token`);
  }
  if (errs.length) {
    console.error(`check-arbitrary-values: ${errs.length} arbitrary value(s) under frameworks/\n`);
    for (const e of errs) console.error(`  ${e}`);
    console.error('\nExpose the token in frameworks/tailwind/theme.css and use the utility, or reference the token as var(--name).');
    process.exit(1);
  }
  console.log(`check-arbitrary-values: ${scanned} file(s) scanned, none`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
