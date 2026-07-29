/* Fails when a component name is declared in more than one category in
 * frameworks/Components.json, when a framework layer places a component
 * directory in a category the file does not assign it, when a component
 * directory exists that no category declares, or when a declared component
 * exists in no layer at all.
 *
 * WHAT THIS DOES NOT CHECK, and it is the interesting half: whether the
 * category is the RIGHT one. "Is Tooltip feedback or navigation?" is editorial
 * judgement and no gate has it. A green run here says the three layers agree
 * with one declaration -- never that the declaration is well taxonomised, and
 * never that a component directory contains a complete component. check:api
 * and check:behaviour are what hold the latter.
 *
 * EVERY LAYER IS IN SCOPE, unconditionally. This gate used to carry a MIGRATED
 * list because the structure refactor landed one layer per batch, and a gate
 * that silently passed over an unmigrated layer would have been worse than one
 * that said which layers it was claiming anything about; the list grew by one
 * entry per batch and was to be deleted outright when the last layer landed.
 * Batch 3 of the refactor moved React, the third and last, so it is gone. With
 * it goes the condition that held rule 4 back: "declared but present in no
 * layer" now runs against every run.
 *
 * LAYERS is not that list under another name, and the difference is the whole
 * point of naming them rather than discovering them. It is an exhaustive
 * enumeration, so a layer that is renamed or moved wholesale does not quietly
 * leave the gate's scope -- readLayer() returns {} for it and zeroLayerProblems
 * says so. A walk of frameworks/ would have made the gate self-maintaining and
 * would also have made a vanished layer indistinguishable from a layer that
 * never existed, which is the false-green shape this repo has now shipped three
 * times.
 *
 *   bun scripts/check-structure.mjs   -> exit 0 clean, 1 with problems listed
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every framework layer, all three of them migrated. See the header for why
 *  this is enumerated rather than discovered by walking frameworks/. */
export const LAYERS = ['tailwind', 'angular', 'react'];

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The kebab directory name a PascalCase component name derives to.
 *  Deterministic, so the mapping is a function and never a table.
 *  @param {string} name e.g. "ActivityFeed" @returns {string} e.g. "activity-feed" */
export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** The PascalCase file stem a kebab directory name derives to -- the inverse of
 *  kebab() above, and the second half of the one derivation this repo has for
 *  the mapping. It lives here beside its inverse rather than being re-derived
 *  wherever a gate needs a file stem: check-api.mjs, check-behaviour.mjs and
 *  scripts/lib/behaviour-contracts.mjs all import from here.
 *
 *  It is an inverse only where kebab() is lossless, which is every name the
 *  tree carries and is not a property of the transform: kebab('UIPanel') is
 *  'uipanel', and nothing recovers 'UIPanel' from that. That is why no caller
 *  TRUSTS the result -- each one builds a path with it and reports loudly when
 *  the file is not there, rather than treating a miss as absence. Angular's
 *  behaviour binding still declares its React counterpart by name for the same
 *  reason (see validateBinding in scripts/lib/behaviour-contracts.mjs): a
 *  cross-layer identity is carried, never derived.
 *  @param {string} dir e.g. "activity-feed" @returns {string} e.g. "ActivityFeed" */
export function pascal(dir) {
  return dir.replace(/(^|-)([a-z0-9])/g, (_, _sep, c) => c.toUpperCase());
}

/** Read one layer's tree as category -> component directory names.
 *  @param {string} layer @returns {Record<string, string[]>} */
export function readLayer(layer) {
  const base = join(repoRoot, 'frameworks', layer, 'components');
  if (!existsSync(base)) return {};
  const out = {};
  for (const cat of readdirSync(base, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    out[cat.name] = readdirSync(join(base, cat.name), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  }
  return out;
}

/** @param {{categories: Record<string,string[]>,
 *           layers: Record<string,Record<string,string[]>>,
 *           complete?: boolean}} input
 *  `complete` says the caller passed every layer there is. Only then does the
 *  "declared but present nowhere" rule run: a component absent from a PARTIAL
 *  set of layers may simply live in one that was not passed, so firing on it
 *  would make the gate loudest about the thing it cannot see. main() passes
 *  true unconditionally now that all three layers are migrated -- the parameter
 *  survives because validateStructure is pure and a caller may hand it any
 *  subset, which is exactly what this function's own suite does.
 *  @returns {string[]} one line per problem, empty when clean */
export function validateStructure({ categories, layers, complete = false }) {
  const problems = [];

  // Assertion 1: no name appears in two categories. Keyed on the PascalCase
  // name exactly as frameworks/Components.json spells it -- "a name appears
  // in two categories" is a statement about that identifier, not about its
  // kebab derivation. Two *different* PascalCase names deriving the same
  // kebab directory is a different property (not what this assertion asks
  // for) and stays unguarded here -- scripts/check-structure.test.mjs's own
  // header records that scope, not an oversight.
  const firstCategoryOf = new Map();   // name -> the first category it was seen in
  for (const [category, names] of Object.entries(categories))
    for (const name of names) {
      if (firstCategoryOf.has(name)) {
        problems.push(`${name} is declared in both ${firstCategoryOf.get(name)} and ${category} in frameworks/Components.json`);
        continue;
      }
      firstCategoryOf.set(name, category);
    }

  const declared = new Map();          // kebab dir -> {name, category}
  for (const [name, category] of firstCategoryOf) declared.set(kebab(name), { name, category });

  const seen = new Set();
  for (const [layer, tree] of Object.entries(layers))
    for (const [category, dirs] of Object.entries(tree))
      for (const dir of dirs) {
        if (!KEBAB.test(dir)) {
          problems.push(`${layer}: components/${category}/${dir} is not a kebab-case directory name`);
          continue;
        }
        const d = declared.get(dir);
        if (!d) {
          problems.push(`${layer}: components/${category}/${dir} is a component directory frameworks/Components.json does not name`);
          continue;
        }
        seen.add(d.name);
        if (d.category !== category)
          problems.push(`${layer}: ${d.name} is in components/${category}/ but frameworks/Components.json assigns it to ${d.category}`);
      }

  if (complete)
    for (const { name } of declared.values())
      if (!seen.has(name))
        problems.push(`${name} is declared in frameworks/Components.json but exists in no layer`);

  return problems;
}

/** A layer that yields zero component directories is not "nothing to check" --
 *  readLayer() returns {} for a missing frameworks/<layer>/components, and
 *  validateStructure() finds zero problems in an empty tree by construction, so
 *  without this a moved or renamed layer would report a clean pass over ground
 *  it never looked at. Same failure mode, same fix, as check-tailwind.mjs's own
 *  "found 0 manifests" guard.
 *
 *  It judges the layers it is HANDED and never decides which layers are in
 *  scope -- LAYERS does that, and it is what makes a vanished layer loud here
 *  rather than absent.
 *  @param {Record<string, Record<string, string[]>>} layers
 *  @returns {string[]} one line per empty layer */
export function zeroLayerProblems(layers) {
  const problems = [];
  for (const [layer, tree] of Object.entries(layers)) {
    const count = Object.values(tree).reduce((n, dirs) => n + dirs.length, 0);
    if (count === 0)
      problems.push(`found 0 component directories in frameworks/${layer}/components — an empty result set is a failure, not a clean pass; check the discovery path`);
  }
  return problems;
}

function main() {
  const categories = JSON.parse(readFileSync(join(repoRoot, 'frameworks/Components.json'), 'utf8'));
  const layers = Object.fromEntries(LAYERS.map((l) => [l, readLayer(l)]));
  const problems = [
    ...zeroLayerProblems(layers),
    ...validateStructure({ categories, layers, complete: true }),
  ];

  if (problems.length) {
    console.error('check:structure — a layer does not match frameworks/Components.json:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = Object.values(categories).reduce((n, names) => n + names.length, 0);
  const checked = Object.values(layers).reduce(
    (n, tree) => n + Object.values(tree).reduce((m, dirs) => m + dirs.length, 0), 0,
  );
  console.log(`check:structure OK — components/ under ${LAYERS.join(', ')} match frameworks/Components.json (${checked} checked of ${total} declared, every declared component present in at least one layer).`);
  console.log('  (A green run says the layers agree with one declaration, never that the categories are well chosen.)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
