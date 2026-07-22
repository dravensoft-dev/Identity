/* Loaders and validators for Arena's behaviour contract layer.
 *
 * A PATTERN says what a kind of component must do -- which roles, which keys,
 * where focus goes. A BINDING says which pattern a component implements, and
 * which of that pattern's requirements it does not yet meet.
 *
 * These live in behaviour/ at the repo root rather than under tokens/ because a
 * contract is not a value and DTCG does not model one. tokens/ answers "what is
 * this value"; behaviour/ answers "what must this component do".
 *
 * Everything here is pure. scripts/check-behaviour.mjs does the filesystem walk
 * and the reporting; this module is what its suite can import. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

export const PATTERN_DIR = 'behaviour/patterns';

/** The one pattern allowed to require nothing: a component that carries no
 *  interactive affordance at all still has to SAY so, which is the whole point
 *  -- "no entry" and "verified presentational" must stop looking alike. */
const NONE = 'none';

/** @returns {string[]} problems; empty means valid */
export function validatePattern(fileStem, pattern) {
  const problems = [];
  if (pattern.name !== fileStem) {
    problems.push(`${fileStem}: name "${pattern.name}" does not match its filename`);
  }
  if (!pattern.source) {
    problems.push(`${fileStem}: no source — a pattern is adopted, not invented, and must cite where from`);
  }
  const keys = Object.keys(pattern.requires ?? {});
  if (fileStem !== NONE && keys.length === 0) {
    problems.push(`${fileStem}: requires is empty — a pattern must state at least one requirement`);
  }
  for (const key of keys) {
    if (!key.includes('.')) {
      problems.push(`${fileStem}: requirement "${key}" must be dotted (group.leaf) so an exception can name exactly one`);
    }
  }
  return problems;
}

/** @returns {Map<string, object>} pattern name -> pattern */
export function loadPatterns(root) {
  const dir = join(root, PATTERN_DIR);
  const out = new Map();
  for (const entry of readdirSync(dir).sort()) {
    if (extname(entry) !== '.json') continue;
    const stem = basename(entry, '.json');
    out.set(stem, JSON.parse(readFileSync(join(dir, entry), 'utf8')));
  }
  return out;
}
