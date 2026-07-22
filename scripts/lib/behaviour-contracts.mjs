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
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

/** @returns {string[]} problems; empty means valid */
export function validateBinding(component, layer, binding, patterns) {
  const problems = [];
  const where = `${layer}/${component}`;
  const pattern = patterns.get(binding.pattern);

  if (!pattern) {
    problems.push(`${where}: unknown pattern "${binding.pattern}" — no such file in ${PATTERN_DIR}`);
    return problems;
  }
  if (binding.pattern === NONE && !binding.reason) {
    problems.push(`${where}: binding none requires a reason — "nothing recorded" and "verified presentational" must not look alike`);
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

/** "Does an Angular primitive exist for this React component" is a different
 *  question from "did its binding parse", and check-behaviour.mjs used to ask
 *  the second when it meant the first: a primitive directory whose
 *  `<name>.behaviour.json` does not exist yet (unbound) was never added to
 *  the script's `angular` Map, so it read as though no primitive existed at
 *  all -- a false "no primitive and no entry in behaviour-delegated.json" for
 *  every unbound primitive.
 *
 *  A BOUND primitive answers this itself: its binding carries an explicit
 *  `component` field naming its React counterpart, precisely so the two
 *  layers' different naming conventions (kebab-case directory, Pascal-case
 *  component) never have to be derived from one another -- that derivation
 *  has bitten this repo twice already (see check-manifest-states.mjs's
 *  SOURCE_OVERRIDES for the other case). This map used to record that same
 *  fact explicitly for every primitive directory that had no
 *  `<name>.behaviour.json` yet, keyed directory name to React component name.
 *  All 21 Angular primitives are bound now, which makes every entry that
 *  could ever have lived here stale by definition -- so the map stays empty
 *  rather than populated and unused. Left EMPTY on purpose: a future
 *  primitive added to `frameworks/angular/primitives/` without its binding
 *  in the same change is exactly the transitional state this map exists to
 *  paper over, and validateUnboundPrimitives below keeps failing the gate on
 *  any entry that no longer describes reality, the same invariant it always
 *  held. */
export const UNBOUND_PRIMITIVES = {};

/** @returns {string[]} problems: an UNBOUND_PRIMITIVES entry that no longer
 *  describes reality -- its directory has vanished, or it has since gained a
 *  `<name>.behaviour.json` and so is bound now, which makes the override
 *  redundant and, left in place, misleading. */
export function validateUnboundPrimitives(root) {
  const problems = [];
  for (const [dir, component] of Object.entries(UNBOUND_PRIMITIVES)) {
    const dirPath = join(root, 'frameworks/angular/primitives', dir);
    if (!existsSync(dirPath)) {
      problems.push(`UNBOUND_PRIMITIVES: "${dir}" (-> ${component}) names a primitive directory that no longer exists`);
      continue;
    }
    if (existsSync(join(dirPath, `${dir}.behaviour.json`))) {
      problems.push(`UNBOUND_PRIMITIVES: "${dir}" now has ${dir}.behaviour.json -- it is bound, so this override is stale; remove the entry and trust binding.component instead`);
    }
  }
  return problems;
}
