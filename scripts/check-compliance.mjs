/* check:compliance — which behaviour bindings are verified by a render suite,
 * and is that record still true.
 *
 * The suites themselves (frameworks/react/test-dom/, frameworks/angular/test/)
 * do the verifying: each asserts, per requirement, that the rendered DOM either
 * meets it with no exception declared or fails it with one declared. This gate
 * does not re-do that, and could not -- it is runtime-portable, reads JSON and
 * filesystem paths only, and never imports a framework layer's .ts or .jsx. What
 * it guards is the *record* of which bindings are covered, because without one
 * the coverage silently rots: a component gains a binding and no suite, and
 * `bun run check` stays green while nobody notices.
 *
 * THE REACT LAYER HAS RENDER SUITES AGAIN, WITH ONE COMPONENT-SHAPED HOLE.
 * frameworks/react/test-dom/ was deleted and restored; what did not come back
 * is grid-keyboard.test.jsx, and the rule that keeps it out is stated here
 * because this is the gate that can see its consequence:
 *
 *   A component whose behaviour binding names the `grid` pattern is
 *   DOM-tested BY HAND -- `bun run demos`, then operate the component on its
 *   own *.card.html page.
 *
 * The rule is tied to the BINDING rather than to a judgement about what looks
 * like a grid, so it is a grep rather than an argument, and so a component that
 * becomes a grid later inherits it without anyone remembering. Today it selects
 * exactly Calendar and Table.
 *
 * It exists because of a measurement, not a preference. grid-keyboard.test.jsx
 * alone peaked at 164 MiB while the other six suites together peaked at 109 --
 * the grid cost more than everything else combined, because its fixture is 84
 * cells per mount, eight mounts, and 160 key events dispatched through act().
 *
 * The price is that Calendar's binding claims "exceptions": [] -- full
 * compliance with the grid pattern -- with no suite behind it, and cannot be
 * listed in COVERED. What guards it instead is a STATIC assertion in
 * frameworks/react/test/calendar.test.jsx: a grid is one tab stop, and that
 * count is a property of the markup rather than of behaviour.
 *
 * COVERED IS DELIBERATELY PARTIAL and grows one component at a time -- run the
 * gate for the live pair rather than trusting a figure written here, which has
 * drifted before. This gate never demands totality: a
 * gate that required a suite per binding on day one would have been switched off
 * within a week, and a switched-off gate guards nothing. It asserts only that
 * every claim in COVERED is TRUE, in both directions -- an entry naming a
 * binding that no longer exists fails, and an entry whose suite no longer reads
 * that binding fails. That bidirectional staleness rule is the property
 * check-dimension-literals.mjs's EXEMPT and check-manifest-states.mjs's EXEMPT
 * both carry, and it is the whole reason either of those records is trusted
 * rather than read as decoration.
 *
 * WHAT A GREEN RUN DOES NOT SAY, stated plainly because three other files in
 * this repo had to learn to say it: that any covered component is accessible. A
 * suite can assert that all of a component's declared exceptions are still
 * true, pass, and leave the component exactly as broken as it was -- ActivityFeed
 * declares an exception against every one of the `feed` pattern's seven
 * requirements, in BOTH layers (no role=feed, no role=article on any row, no
 * accessible name, no aria-posinset/aria-setsize, no aria-busy, and no onKeyDown
 * handler anywhere so neither PageUp nor PageDown does anything) and would pass a
 * suite written against either binding today, because every one of those
 * exceptions is true. A green run is a claim about the honesty
 * of the declarations. It is never an accessibility claim, exactly as
 * check:behaviour's own header says of coverage.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { reactComponents, angularPrimitives, loadBinding, bindingCases } from './lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

/** The suite directories this gate reads. The Angular entry covers both halves
 *  of that layer's suites since colocation: the per-component ones now sitting
 *  beside the component they cover under components/, and the handful that stay
 *  in test/ (the two harness modules' own dependents, plus the suites that cover
 *  more than one component or the harness itself). Both are walked recursively
 *  by walkSuites() below, so nesting depth does not matter here. */
export const SUITE_DIRS = [
  join(repoRoot, 'frameworks', 'react', 'test-dom'),
  join(repoRoot, 'frameworks', 'angular', 'components'),
  join(repoRoot, 'frameworks', 'angular', 'test'),
];

/**
 * Bindings verified by a render suite: `<Component>:<layer>` -> the suite
 * file that verifies it.
 *
 * Keyed by the Pascal-case COMPONENT name and the layer the suite actually
 * renders, joined by a `:`. A bare component-name key used to let a mention of
 * EITHER layer's binding file satisfy the claim, which was a real defect: several
 * of the components below (`ConfirmDialog`, `Skeleton`, `Alert`, `BarChart`)
 * are bound in both layers, so a suite covering one layer was silently marking
 * the OTHER layer's contract "covered" too, with no suite ever touching it.
 * `ConfirmDialog`'s React suite was marking its Angular contract covered, and
 * `Alert`'s Angular suite was doing the same to its React one. The compound
 * key names exactly the layer the suite verifies; a component bound in both
 * layers needs two entries, one per layer, each proven independently. A key
 * with no `:layer` suffix is rejected outright rather than falling back to
 * name-only resolution, so the old shape cannot creep back in silently.
 *
 * The Angular binding FILE is named for the kebab directory it sits in
 * (`bar-chart/bar-chart.behaviour.json` declares component "BarChart"), so the
 * mention check below searches for the file stem of THAT layer's binding, not
 * the key.
 *
 * Add an entry when you add a suite. Removing or renaming a suite without
 * removing its entry fails this gate, which is the point.
 * @type {Record<string, string>}
 */
export const COVERED = {
  'Dialog:react': 'dialog-modal.test.jsx',
  'ConfirmDialog:react': 'dialog-modal.test.jsx',
  'Onboarding:react': 'onboarding-modal.test.jsx',
  'Menu:react': 'placement-and-branches.test.jsx',
  'Skeleton:react': 'placement-and-branches.test.jsx',
  'SideNavCollapsible:react': 'side-nav-disclosure.test.jsx',
  'Tabs:react': 'tabs.test.jsx',
  'Tooltip:react': 'tooltip-keyboard.test.jsx',
  'Alert:react': 'alert-tones.test.jsx',
  'Toast:react': 'alert-tones.test.jsx',
  'Alert:angular': 'Alert.roleTones.test.ts',
  'BarChart:angular': 'ChartDataTable.test.ts',
  'Tag:react': 'tag-and-chip-cases.test.jsx',
  'Tag:angular': 'Tag.cases.test.ts',
  'CalendarEvent:react': 'tag-and-chip-cases.test.jsx',
};

/** Does a suite's source read this binding at all?
 *  A filename match, not a semantic one -- enough to catch a suite that was
 *  renamed or gutted while COVERED still claimed it, and deliberately no more:
 *  proving a suite *asserts the right thing* is what the suite itself is for.
 *  @param {string} source @param {string} stem the binding file's basename stem
 *  @returns {boolean} */
export function suiteMentions(source, stem) {
  return source.includes(`${stem}.behaviour.json`);
}

/** The pure half, so the gate's own test can exercise every failure branch
 *  without a filesystem. Everything arrives by parameter on purpose: an earlier
 *  gate in this chain read module globals and its failure branches were
 *  therefore untestable, which is recorded as debt.
 *
 *  A binding record carries `layer` ('react' or 'angular') and `stem`, the
 *  basename of the file it was read from, when that differs from the component
 *  name; `stem` defaults to the name. A `COVERED` key is `<Component>:<layer>`
 *  and resolves to the ONE binding matching both name and layer -- never to
 *  any binding sharing the name, which is the dual-bound defect this shape
 *  replaces. A key with no `:layer` suffix is rejected rather than silently
 *  falling back to name-only resolution.
 *
 *  @param {{bindings: {name: string, patterns: string[], layer: string, stem?: string}[], covered: Record<string,string>, suites: Record<string,string>}} o
 *  @returns {string[]} one message per problem, empty when clean */
export function validateCoverage({ bindings, covered, suites }) {
  const problems = [];
  /** @type {Map<string, string>} "name:layer" -> its binding file stem */
  const byKey = new Map();
  for (const b of bindings) {
    byKey.set(`${b.name}:${b.layer}`, b.stem ?? b.name);
  }

  for (const [key, suiteFile] of Object.entries(covered)) {
    const sep = key.lastIndexOf(':');
    if (sep === -1) {
      problems.push(
        `COVERED key "${key}" has no ":layer" suffix. Every key must be shaped "<component>:<layer>".`,
      );
      continue;
    }
    const name = key.slice(0, sep);
    const layer = key.slice(sep + 1);

    if (!byKey.has(key)) {
      problems.push(
        `COVERED names "${key}", for which there is no binding named "${name}" in the ${layer} layer. Delete the entry.`,
      );
      continue;
    }
    if (!(suiteFile in suites)) {
      problems.push(`COVERED maps "${key}" to "${suiteFile}", which does not exist. Fix the path or delete the entry.`);
      continue;
    }
    const stem = byKey.get(key);
    if (!suiteMentions(suites[suiteFile], stem)) {
      problems.push(
        `COVERED maps "${key}" to "${suiteFile}", but that suite never mentions ${stem}.behaviour.json. The coverage claim is stale.`,
      );
    }
  }
  return problems;
}

/** Normalise a map of raw binding records into inventory rows -- one row per
 *  BINDING, never one per case, because there is deliberately no way to
 *  record half a component covered. `bindings` is keyed "<name>:<layer>",
 *  the same shape COVERED itself uses, mapping to the raw *.behaviour.json
 *  content; a cased binding still contributes exactly one row, and
 *  `patterns` names every case's pattern rather than a single `pattern`.
 *
 *  `stem` -- the binding file's basename, when that differs from the
 *  component name -- is filesystem information this function never derives
 *  on its own; it is carried through when the caller attaches it to the
 *  binding record (`{...binding, stem}`), and defaults to `name` otherwise,
 *  the same default `validateCoverage` already applies.
 *
 *  This IS the loop body collectBindings() below runs -- not a parallel
 *  copy of it -- so a test against this function is a test against the
 *  code the gate actually executes.
 *  @param {Record<string, {pattern?: string, cases?: object[], stem?: string}>} bindings
 *  @returns {{name: string, layer: string, stem: string, patterns: string[]}[]} */
export function inventoryFrom(bindings) {
  const out = [];
  for (const [key, binding] of Object.entries(bindings)) {
    const sep = key.lastIndexOf(':');
    const name = sep === -1 ? key : key.slice(0, sep);
    const layer = sep === -1 ? '' : key.slice(sep + 1);
    out.push({
      name,
      layer,
      stem: binding.stem ?? name,
      patterns: bindingCases(binding).map((c) => c.pattern),
    });
  }
  return out;
}

/** Read every binding in the tree as {name, patterns, layer, stem}, via
 *  inventoryFrom() above -- this function's only job is assembling the
 *  "<name>:<layer>" -> binding map from the filesystem; the row shape
 *  itself is inventoryFrom's, so there is exactly one place that turns a
 *  binding into a row.
 *
 *  React components live one group directory deep and reactComponents() returns
 *  bare names, so the group is found by looking; Angular primitives are one
 *  directory each and the directory name is the file stem.
 *
 *  `frameworks/angular/behaviour-delegated.json` is deliberately NOT read here.
 *  A delegated declaration describes a control Angular Material provides and
 *  this repo does not render, so no suite in this tree could ever verify one --
 *  counting them would inflate the denominator with bindings that are uncoverable
 *  by construction. check:behaviour is what holds those entries honest. */
function collectBindings() {
  /** @type {Record<string, object>} "<name>:<layer>" -> binding, plus stem */
  const byKey = {};

  const reactBase = join(repoRoot, 'frameworks/react/components');
  const groups = readdirSync(reactBase, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const name of reactComponents(repoRoot)) {
    const group = groups.find((g) => existsSync(join(reactBase, g, `${name}.behaviour.json`)));
    if (!group) continue; // check:behaviour owns "every component declares"; this gate does not duplicate it.
    const binding = loadBinding(join(reactBase, group, `${name}.behaviour.json`));
    byKey[`${name}:react`] = { ...binding, stem: name };
  }

  const angularBase = join(repoRoot, 'frameworks/angular/primitives');
  for (const dir of angularPrimitives(repoRoot)) {
    const path = join(angularBase, dir, `${dir}.behaviour.json`);
    if (!existsSync(path)) continue;
    const binding = loadBinding(path);
    byKey[`${binding.component}:angular`] = { ...binding, stem: dir };
  }

  return inventoryFrom(byKey);
}

/** Every suite file under `dir`, found by a recursive walk rather than a flat
 *  `readdirSync` -- the Angular half of SUITE_DIRS is now a component tree,
 *  category/component nested, not a flat directory of suites.
 *  @param {string} dir @returns {string[]} absolute paths */
export function walkSuites(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSuites(path));
    } else if (/\.test\.(jsx|ts|mjs)$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

/** Read every suite file's source, keyed by basename, across every directory
 *  in `dirs` (defaults to the real SUITE_DIRS -- a parameter so a test can
 *  point this at a throwaway tree instead of the repo's own).
 *
 *  Keying by basename stops being safe to do silently once suites are nested:
 *  a flat directory can never produce two files of the same name, but a walk
 *  over a component tree can, and the old flat `readdirSync` had no assertion
 *  because it never needed one. A collision here means one suite would
 *  silently shadow the other in every lookup keyed by basename -- COVERED's
 *  `suiteMentions` check among them -- so it throws rather than picking a
 *  winner nobody chose.
 *  @param {string[]} [dirs] @returns {Record<string,string>} */
export function collectSuites(dirs = SUITE_DIRS) {
  const out = {};
  const seen = new Map();
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of walkSuites(dir)) {
      const name = basename(f);
      if (seen.has(name))
        throw new Error(
          `check:compliance — two suites share the basename ${name}:\n  ${seen.get(name)}\n  ${f}\n` +
          `Suites are keyed by basename, so one would silently shadow the other.`);
      seen.set(name, f);
      out[name] = readFileSync(f, 'utf8');
    }
  }
  return out;
}

function main() {
  const bindings = collectBindings();
  const suites = collectSuites();
  const problems = validateCoverage({ bindings, covered: COVERED, suites });

  if (problems.length) {
    console.error('check:compliance — the coverage record no longer matches the tree:\n');
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
  }
  const total = bindings.length;
  const n = Object.keys(COVERED).length;
  console.log(`check:compliance OK — ${n} of ${total} bindings verified by a render suite; every coverage claim is current.`);
  console.log('  (A green run says the declarations are honest, never that the components are accessible.)');
}

/* Behind the guard so the test above can import the pure helpers without the
 * scan running -- an unguarded process.exit(1) has killed a test process in this
 * repo twice. */
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
