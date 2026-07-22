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
 * COVERED IS DELIBERATELY PARTIAL and grows one component at a time -- six of
 * the sixty-four bindings in the tree today. This gate never demands totality: a
 * gate that required forty-seven suites on day one would have been switched off
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
 * suite can assert that all four of a component's declared exceptions are still
 * true, pass, and leave the component exactly as broken as it was -- Calendar
 * and Table implement no keyboard navigation at all and would pass a suite
 * written against their bindings today. A green run is a claim about the honesty
 * of the declarations. It is never an accessibility claim, exactly as
 * check:behaviour's own header says of coverage.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { reactComponents, angularPrimitives, loadBinding } from './lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

/** The suite directories this gate reads. */
export const SUITE_DIRS = [
  join(repoRoot, 'frameworks', 'react', 'test-dom'),
  join(repoRoot, 'frameworks', 'angular', 'test'),
];

/**
 * Bindings verified by a render suite: component name -> the suite file that
 * verifies it.
 *
 * Keyed by the Pascal-case COMPONENT name on both layers. An Angular binding
 * names its React counterpart in its own `component` field and that field is
 * used rather than derived, because kebab->Pascal has no safe inverse and a
 * cross-layer check that silently never fires looks exactly like coverage. The
 * Angular binding FILE, though, is named for the kebab directory it sits in
 * (`bar-chart/bar-chart.behaviour.json` declares component "BarChart"), so the
 * mention check below searches for the file stem, not the key.
 *
 * Add an entry when you add a suite. Removing or renaming a suite without
 * removing its entry fails this gate, which is the point.
 * @type {Record<string, string>}
 */
export const COVERED = {
  Dialog: 'dialog-modal.test.jsx',
  ConfirmDialog: 'dialog-modal.test.jsx',
  Menu: 'placement-and-branches.test.jsx',
  Skeleton: 'placement-and-branches.test.jsx',
  Alert: 'alert-role-tones.test.ts',
  BarChart: 'chart-data-table.test.ts',
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
 *  A binding record may carry `stem`, the basename of the file it was read from,
 *  when that differs from the component name; it defaults to the name. Records
 *  sharing a name (a component bound in both layers) contribute one stem each,
 *  and a mention of ANY of them satisfies the claim -- the record says a suite
 *  verifies this component somewhere, not in which layer.
 *
 *  @param {{bindings: {name: string, pattern: string, stem?: string}[], covered: Record<string,string>, suites: Record<string,string>}} o
 *  @returns {string[]} one message per problem, empty when clean */
export function validateCoverage({ bindings, covered, suites }) {
  const problems = [];
  /** @type {Map<string, string[]>} component name -> its binding file stems */
  const stems = new Map();
  for (const b of bindings) {
    if (!stems.has(b.name)) stems.set(b.name, []);
    stems.get(b.name).push(b.stem ?? b.name);
  }

  for (const [name, suiteFile] of Object.entries(covered)) {
    if (!stems.has(name)) {
      problems.push(`COVERED names "${name}", for which there is no binding in the tree. Delete the entry.`);
      continue;
    }
    if (!(suiteFile in suites)) {
      problems.push(`COVERED maps "${name}" to "${suiteFile}", which does not exist. Fix the path or delete the entry.`);
      continue;
    }
    const candidates = stems.get(name);
    if (!candidates.some((stem) => suiteMentions(suites[suiteFile], stem))) {
      const wanted = candidates.map((s) => `${s}.behaviour.json`).join(' or ');
      problems.push(
        `COVERED maps "${name}" to "${suiteFile}", but that suite never mentions ${wanted}. The coverage claim is stale.`,
      );
    }
  }
  return problems;
}

/** Read every binding in the tree as {name, pattern, stem}.
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
  const out = [];

  const reactBase = join(repoRoot, 'frameworks/react/components');
  const groups = readdirSync(reactBase, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const name of reactComponents(repoRoot)) {
    const group = groups.find((g) => existsSync(join(reactBase, g, `${name}.behaviour.json`)));
    if (!group) continue; // check:behaviour owns "every component declares"; this gate does not duplicate it.
    const binding = loadBinding(join(reactBase, group, `${name}.behaviour.json`));
    out.push({ name, pattern: binding.pattern, stem: name });
  }

  const angularBase = join(repoRoot, 'frameworks/angular/primitives');
  for (const dir of angularPrimitives(repoRoot)) {
    const path = join(angularBase, dir, `${dir}.behaviour.json`);
    if (!existsSync(path)) continue;
    const binding = loadBinding(path);
    out.push({ name: binding.component, pattern: binding.pattern, stem: dir });
  }

  return out;
}

/** Read every suite file's source, keyed by basename. */
function collectSuites() {
  const out = {};
  for (const dir of SUITE_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!/\.test\.(jsx|ts|mjs)$/.test(f)) continue;
      out[basename(f)] = readFileSync(join(dir, f), 'utf8');
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
