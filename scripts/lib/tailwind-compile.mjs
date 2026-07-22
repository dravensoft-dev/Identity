/* Compiles Arena's Tailwind layer the way a consumer would, and takes apart a
 * component manifest. Shared by check-tailwind.mjs and any gate that needs the
 * real emitted CSS rather than a restatement of it.
 *
 * The CLI is spawned as `process.execPath <bin>.mjs` rather than through a
 * shell or a package runner, so the gate behaves identically under bun and
 * node. The entry stylesheet is fed on stdin with absolute paths, so nothing
 * temporary is written into the repository.
 *
 * The preset import carries `source(none)`, which disables Tailwind v4's
 * automatic content detection — without it the CLI also scans the whole repo
 * for class-shaped strings, so a gate result would depend on unrelated text
 * (a prop value, a comment, anything matching a utility's shape) anywhere in
 * the tree rather than on the Tailwind layer itself. The explicit `@source`
 * line is what still puts the manifests in scope. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');

/** Every class candidate a manifest declares, deduped and sorted.
 *  @param {object} manifest @returns {string[]} */
export function manifestClasses(manifest) {
  const out = new Set();
  const eat = (v) => {
    if (typeof v === 'string') for (const c of v.split(/\s+/)) { if (c) out.add(c); }
    else if (v && typeof v === 'object') for (const child of Object.values(v)) eat(child);
  };
  eat(manifest.slots);
  eat(manifest.variants);
  return [...out].sort();
}

/** A class as it appears in Tailwind's compiled selector, minus the leading dot.
 *  Tailwind escapes every character that is not [A-Za-z0-9_-] with a backslash,
 *  except a *leading* digit: CSS identifiers cannot start with one, so it is
 *  hex-escaped instead — a backslash, the code point in lowercase hex, and a
 *  single trailing space (e.g. `2xl:hidden` -> `\32 xl\:hidden`). */
export function escapeClass(cls) {
  const backslash = (s) => s.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
  if (/^[0-9]/.test(cls))
    return `\\${cls.codePointAt(0).toString(16)} ${backslash(cls.slice(1))}`;
  return backslash(cls);
}

/** The stdin entry stylesheet: the preset with automatic content detection
 *  disabled (`source(none)`), plus the component manifests registered as the
 *  only explicit source. Without `source(none)` the CLI additionally scans
 *  the whole repository for class-shaped strings, so the compiled CSS — and
 *  every gate reading it — would depend on unrelated text anywhere in the
 *  tree instead of on the preset and the manifests alone.
 *  `extra`, when given, registers one more glob as content — used by
 *  scripts/tailwind-vocabulary.test.mjs to compile a throwaway manifest
 *  without writing it into the repository.
 *  @param {string} preset absolute path to the preset CSS
 *  @param {string} components absolute path to the manifests directory
 *  @param {string} [extra] absolute glob of additional content
 *  @returns {string} */
export function entryStylesheet(preset, components, extra) {
  return `@import '${preset}' source(none);\n@source '${components}/*.manifest.json';\n`
    + (extra ? `@source '${extra}';\n` : '');
}

/** Compile the preset together with every component manifest as content.
 *  @param {{root?: string, extraSource?: string}} [opts]
 *  @returns {{css: string, manifests: Map<string, object>}} */
export function compileLayer(opts = {}) {
  const root = opts.root ?? repoRoot;
  const preset = join(root, 'frameworks/tailwind/theme.css');
  const components = join(root, 'frameworks/tailwind/components');
  const bin = join(root, 'node_modules/.bin/tailwindcss');

  const manifests = new Map();
  for (const f of readdirSync(components).filter((f) => f.endsWith('.manifest.json')).sort())
    manifests.set(f, JSON.parse(readFileSync(join(components, f), 'utf8')));

  const entry = entryStylesheet(preset, components, opts.extraSource);
  const dir = mkdtempSync(join(tmpdir(), 'arena-tw-'));
  const out = join(dir, 'out.css');
  try {
    const r = spawnSync(process.execPath, [bin, '-i', '-', '-o', out], { input: entry, encoding: 'utf8' });
    if (r.status !== 0) {
      if (r.error) throw new Error(`tailwindcss failed to spawn: ${r.error.message || r.error}`);
      throw new Error(`tailwindcss exited ${r.status}\n${r.stderr || r.stdout}`);
    }
    return { css: readFileSync(out, 'utf8'), manifests };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
