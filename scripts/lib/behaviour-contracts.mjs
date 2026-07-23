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

/** The two patterns allowed to require nothing, and binding either REQUIRES a
 *  reason -- a component that carries no interactive affordance at all
 *  (`none`) still has to SAY so, and so does a layer that has no such
 *  component at all (`absent`). Collapsing them into one value is exactly the
 *  conflation this layer exists to end: "Angular's Card renders but does
 *  nothing" and "Angular has no Calendar" are different facts, and a tool
 *  reading the binding must be able to tell them apart, not just a person
 *  reading the prose next to it. */
const NONE = 'none';
const ABSENT = 'absent';
const REQUIRES_OPTIONAL = new Set([NONE, ABSENT]);

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
  if (!REQUIRES_OPTIONAL.has(fileStem) && keys.length === 0) {
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

/** Read one *.behaviour.json from a path.
 *
 *  Exported so the compliance suites read a binding through exactly the code
 *  check:behaviour reads it with. A second `JSON.parse` in the React and Angular
 *  suites would be a second definition of the file format, free to drift from
 *  this one the day a binding grows a field that needs interpreting rather than
 *  just parsing -- and the suites would keep passing while asserting against a
 *  shape the gate no longer agrees with. */
export function loadBinding(absPath) {
  return JSON.parse(readFileSync(absPath, 'utf8'));
}

/** @returns {string[]} problems; empty means valid */
export function validateBinding(component, layer, binding, patterns) {
  const problems = [];
  const where = `${layer}/${component}`;
  const pattern = patterns.get(binding.pattern);

  if (!pattern) {
    problems.push(`${where}: unknown pattern "${binding.pattern}" — no such file in ${PATTERN_DIR}`);
    return problems;
  }
  if (REQUIRES_OPTIONAL.has(binding.pattern) && !binding.reason) {
    problems.push(`${where}: binding ${binding.pattern} requires a reason — "nothing recorded", "verified presentational" and "does not exist here" must not look alike`);
  }
  if ('delegatedTo' in binding && !binding.delegatedTo) {
    problems.push(`${where}: delegatedTo must name what provides the behaviour, e.g. "Angular Material matTooltip"`);
  }
  /* An Angular primitive's directory name is kebab-case; its React counterpart is
   * Pascal. Never derive one from the other -- scriptName('sp-4') is 'sp4' and
   * nothing recovers 'sp-4' from that, and the same asymmetry applies here.
   * Carrying the name is what lets the cross-layer assertion fire at all. */
  if (layer === 'angular' && !binding.component) {
    problems.push(`${where}: an angular binding must declare "component", naming its React counterpart (e.g. "StatCard" for stat-card)`);
  }
  for (const exception of binding.exceptions ?? []) {
    if (!(exception.requirement in pattern.requires)) {
      problems.push(`${where}: exception names no requirement "${exception.requirement}" in pattern ${binding.pattern} — stale or mistyped`);
    }
    if (!exception.reason) {
      problems.push(`${where}: exception for "${exception.requirement}" has no reason`);
    }
  }
  return problems;
}

/** True when a React binding and the other layer's binding for the same component
 *  may coexist without check-behaviour.mjs's cross-layer step flagging them: they
 *  name the same pattern, one declares `divergesFrom` naming the other's pattern,
 *  or either side binds `absent`. That last clause is not a special case bolted on
 *  -- it follows from what `absent` means: a layer with no such component at all
 *  has no surface for a pattern requirement to hold or fail against, so there is
 *  nothing to compare its (nonexistent) behaviour to. Declaring `divergesFrom`
 *  against an absent binding would assert a divergence from a component that does
 *  not exist, which is not true either -- silence is the honest state here, not a
 *  declared difference. */
export function crossLayerAgrees(a, b) {
  if (a.pattern === b.pattern) return true;
  if (a.pattern === ABSENT || b.pattern === ABSENT) return true;
  if (a.divergesFrom === b.pattern || b.divergesFrom === a.pattern) return true;
  return false;
}

/** Every React component, by exported name. A `*.card.entry.jsx` is a demo page's
 *  composition script, not a component, and has no contract. */
export function reactComponents(root) {
  const base = join(root, 'frameworks/react/components');
  const out = [];
  for (const group of readdirSync(base)) {
    for (const file of readdirSync(join(base, group))) {
      if (extname(file) !== '.jsx' || file.includes('.card.entry.')) continue;
      out.push(basename(file, '.jsx'));
    }
  }
  return out.sort();
}

/** Every Angular primitive, by directory name. Bare `.ts` files under
 *  primitives/ are shared internals (chart-internals, focus-trap), not
 *  components, so the walk keys on directories. */
export function angularPrimitives(root) {
  const base = join(root, 'frameworks/angular/primitives');
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}
