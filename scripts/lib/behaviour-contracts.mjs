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
import { pascal } from '../check-structure.mjs';

export const PATTERN_DIR = 'contracts/behaviour';

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

/** A binding's render CASES, normalised, and the one place the two shapes meet.
 *
 *  A binding describes a component; comparePattern judges a RENDER. A component
 *  that renders differently depending on its own props is several renders, and no
 *  flat exception list is correct for all of them. Skeleton is the case that
 *  motivated this, and the motivation is history rather than a description of
 *  today's tree -- 8C10 fixed the underlying defect, so `Skeleton` now binds flat
 *  `status` with no exceptions and no cases. It is kept because it is WHY this
 *  function exists. As it stood: its `status` binding carried two exceptions true
 *  of the `circle` variant alone -- three of its four variants met the pattern
 *  outright, and `circle` implemented a different case entirely (aria-hidden,
 *  decorative, no live region). Nothing about the component was under-tested --
 *  `placement-and-branches.test.jsx` had two hand-written tests asserting all
 *  four variants directly. What a flat exception list could not do is feed all
 *  four to the ONE mechanism that can make an exception expire: `assertPattern`
 *  judges a single render, so it had to be pinned to `circle`, the one variant
 *  where the two exceptions were actually true -- documented in place, where
 *  pinning it to `block` instead correctly reported both as STALE EXCEPTION. A
 *  reader of the binding alone was told a Skeleton is a `status` missing two
 *  requirements, which was true of one variant in four and silent about the rest.
 *  That the case which motivated `cases` was later fixed and un-cased does not
 *  weaken the mechanism: a component whose renders genuinely differ still needs
 *  it. For the bindings that are cased TODAY, run
 *  `grep -rl '"cases"' --include='*.behaviour.json' frameworks/` -- deliberately a
 *  command and not a list, because a component name written into a comment or
 *  another component's reason string is a cross-file claim no gate checks, which
 *  is how this very paragraph went stale (see CLAUDE.md's Known debt).
 *
 *  The flat shape stays valid and means ONE case, so the untouched majority of
 *  bindings is not churned to say what it already says. Every consumer reads
 *  bindings through here rather than testing for `cases` itself: a second place
 *  that decides what a case is would be free to disagree with this one.
 *
 *  An anonymous case (`name: null`) is how a flat binding presents itself, and it
 *  is what the wrappers refuse when a suite asks for cases by name.
 *
 *  `reason` rides along because a case may bind `none` or `absent`, and those
 *  REQUIRE one -- "nothing recorded", "verified presentational" and "does not
 *  exist here" must not look alike. A case's own reason wins; a flat binding's
 *  reason is carried in its place, which is what keeps every existing `none`
 *  binding valid without being rewritten.
 *  @param {{pattern?: string, exceptions?: object[], reason?: string, cases?: object[]}} binding
 *  @returns {Array<{name: string|null, when: string|null, pattern: string, reason: string|null, exceptions: object[]}>} */
export function bindingCases(binding) {
  if (!Array.isArray(binding.cases)) {
    return [{
      name: null,
      when: null,
      pattern: binding.pattern,
      reason: binding.reason ?? null,
      exceptions: binding.exceptions ?? [],
    }];
  }
  return binding.cases.map((c) => ({
    name: c.name ?? null,
    when: c.when ?? null,
    pattern: c.pattern,
    reason: c.reason ?? binding.reason ?? null,
    exceptions: c.exceptions ?? [],
  }));
}

/** @returns {string[]} problems; empty means valid */
export function validateBinding(component, layer, binding, patterns) {
  const problems = [];
  const where = `${layer}/${component}`;

  if ('pattern' in binding && Array.isArray(binding.cases)) {
    problems.push(`${where}: declares both "pattern" and "cases" — a binding declares one or the other. Two places for one fact is what deriving IDREF from IDREF_ATTRIBUTES fixed once already.`);
    return problems;
  }
  for (const c of bindingCases(binding)) {
    const label = c.name ? `${where} case "${c.name}"` : where;
    if (c.name !== null && !c.when) {
      problems.push(`${label}: a case must say WHEN it is produced. Prose is enough and prose is all that is possible -- nothing can verify a suite rendered the configuration a case names.`);
    }
    const pattern = patterns.get(c.pattern);
    if (!pattern) {
      problems.push(`${label}: unknown pattern "${c.pattern}" — no such file in ${PATTERN_DIR}`);
      continue;
    }
    if (REQUIRES_OPTIONAL.has(c.pattern) && !c.reason) {
      problems.push(`${label}: binding ${c.pattern} requires a reason — "nothing recorded", "verified presentational" and "does not exist here" must not look alike`);
    }
    for (const e of c.exceptions) {
      if (!(e.requirement in pattern.requires)) {
        problems.push(`${label}: excepts "${e.requirement}", which pattern "${c.pattern}" does not require`);
      }
      if (!e.reason) {
        problems.push(`${label}: exception for "${e.requirement}" has no reason`);
      }
    }
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
 *  declared difference.
 *
 *  Both escapes are checked BEFORE the cased-binding comparison, and that order
 *  is the fix batch 8C9 task 5 found missing: the cased branch below returns
 *  unconditionally once case names match, so neither escape below it could ever
 *  fire for a cased binding -- not `absent` (which Calendar's own binding would
 *  need, the moment either side of a Calendar-shaped divergence grew cases), and
 *  not `divergesFrom` (which Toast needs today: React's Toast is cased,
 *  Angular's is a flat delegated `alert` binding for MatSnackBar, which does not
 *  vary by tone, and that is a real divergence rather than a defect in either).
 *
 *  The truthiness guard on each `divergesFrom` read is not decoration: a cased
 *  binding has no top-level `pattern`, so for two ordinary cased bindings that
 *  never declared one, both `a.divergesFrom` and `b.pattern` are `undefined`,
 *  and a bare `a.divergesFrom === b.pattern` would read that as a match and
 *  wave through any two cased bindings whose cases actually disagree -- the
 *  exact defect fix round 1 exists to catch. Requiring the LHS to be a real,
 *  truthy string first is what keeps the escape from swallowing the rule.
 *
 *  WHAT THAT ORDER COSTS, since the order itself is right and the cost is not
 *  obvious: a top-level `divergesFrom` matching the counterpart's pattern
 *  satisfies the escape for the WHOLE binding, so the per-case comparison below
 *  never runs and every case is unchecked across layers. The live example is
 *  `Toast`, which at the time of writing is the only binding that is both cased
 *  and carries `divergesFrom` -- check that rather than trusting it, with
 *  `grep -rl divergesFrom frameworks/` against the cased-binding grep above,
 *  since this is exactly the kind of cross-file claim that entry warns about
 *  (React's `divergesFrom: "alert"` against the flat `alert` that
 *  `BehaviourDelegated.json` binds for Angular's MatSnackBar): its `danger` case
 *  could change from `alert` to anything at all and this function would stay
 *  silent, because the escape already returned true two lines up. That is not
 *  fixable by reordering -- a flat counterpart has no cases to compare against,
 *  which is the whole reason the escape exists -- so a cased binding that
 *  declares `divergesFrom` is trusting its own render suite alone for every
 *  case's pattern, and nothing cross-layer stands behind it. */
export function crossLayerAgrees(a, b) {
  if (a.pattern === ABSENT || b.pattern === ABSENT) return true;
  if (a.divergesFrom && a.divergesFrom === b.pattern) return true;
  if (b.divergesFrom && b.divergesFrom === a.pattern) return true;

  const mine = bindingCases(a);
  const theirs = bindingCases(b);
  const names = (cs) => cs.map((c) => c.name).sort().join(',');
  if (names(mine) !== names(theirs)) return false;
  /* A cased binding has no top-level `pattern` -- the both-fields rejection in
   * validateBinding forbids declaring both -- so falling through to the
   * `a.pattern === b.pattern` check below would compare `undefined ===
   * undefined` and agree trivially, no matter what each case actually binds.
   * Names matching is necessary but not sufficient: the same name must also
   * bind the same pattern on both sides, matched BY NAME rather than by
   * position, since the names check above already establishes order does not
   * matter. */
  if (Array.isArray(a.cases) || Array.isArray(b.cases)) {
    const byName = (cs) => new Map(cs.map((c) => [c.name, c.pattern]));
    const theirsByName = byName(theirs);
    return mine.every((c) => theirsByName.get(c.name) === c.pattern);
  }
  return a.pattern === b.pattern;
}

/** Every React component, by PascalCase name, across every category.
 *
 *  A COMPONENT IS A DIRECTORY. The layer is
 *  `frameworks/react/components/<category>/<kebab>/` as of the structure
 *  refactor's batch 3, so the walk is two levels deep and keys on directories at
 *  both, exactly as angularPrimitives() below does. Everything belonging to one
 *  component -- its `.jsx`, its `.d.ts`, its binding, its prompt, its demo page,
 *  its suites -- lives in that one directory, and a loose FILE beside the
 *  directories is by construction not a component: a category-wide demo page and
 *  its `*.card.entry.jsx` composition script, or a suite spanning more than one
 *  component. Neither can be mistaken for a directory.
 *
 *  It returns PascalCase names because both callers key on that -- check:behaviour
 *  reports `react/<Name>` and check:compliance builds a `<Name>:react` coverage
 *  key -- and `pascal()` is the same derivation check:structure's `kebab()`
 *  inverts, imported from there rather than re-spelled here. Use
 *  reactBindingPath() below to get back to a file; the category is deliberately
 *  not returned, for the reason angularPrimitives() gives.
 *
 *  This walk USED TO key on "a `.jsx` whose filename starts with a capital",
 *  with a documented carve-out for `.card.entry.` and one for kebab-case helper
 *  modules -- `side-nav-inject.jsx` was the file that forced the second. That
 *  heuristic is retired rather than merely unused: this layout breaks it outright,
 *  since the naming rule spells every file capital-initial and that helper is
 *  `SideNavInject.jsx` today. Keying on directories is what the Angular walk had
 *  already been doing since batch 2. */
export function reactComponents(root) {
  const base = join(root, 'frameworks/react/components');
  const out = [];
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (dir.isDirectory()) out.push(pascal(dir.name));
    }
  }
  return out.sort();
}

/** Every Angular component, by kebab directory name, across every category.
 *
 *  The layer is `frameworks/angular/components/<category>/<kebab>/` as of the
 *  structure refactor's batch 2, so the walk is two levels deep. What has not
 *  changed is that a bare `.ts` FILE sitting beside a category's component
 *  directories is never a component. Two kinds are there today: an `index.ts`
 *  barrel, in every category, and one suite -- `components/charts/ChartDataTable.test.ts`,
 *  beside the four chart directories. Neither is a shared internal; the shared
 *  internals all sit at the LAYER root (`ContainerSize.ts`, `DataVisuals.ts`,
 *  `FocusTrap.ts`, `ProjectionMarkers.ts`), which the walk never descends into
 *  at all. ChartInternals.ts under `components/charts/` was the prior worked
 *  example of a shared internal one level in; batch 3 moved it to the layer root
 *  and renamed it DataVisuals.ts, when a display component turned out to consume
 *  it too. So both levels of the walk key on directories.
 *
 *  It returns the KEBAB directory names, not the PascalCase component names,
 *  and both callers key on that: check-behaviour.mjs reports `angular/<dir>`
 *  and check-compliance.mjs resolves a binding path from it. The category is
 *  deliberately not returned -- a component's category is
 *  frameworks/Components.json's to declare and check:structure's to hold, and
 *  a second gate carrying it would be a second opinion nothing reconciles.
 *  Use angularBindingPath() below to get back to a file. */
export function angularPrimitives(root) {
  const base = join(root, 'frameworks/angular/components');
  const out = [];
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const dir of readdirSync(join(base, category.name), { withFileTypes: true })) {
      if (dir.isDirectory()) out.push(dir.name);
    }
  }
  return out.sort();
}

/** The behaviour binding an Angular component directory holds, as
 *  `{path, stem, tail}` -- the ONE place the Angular layer's binding path is
 *  built.
 *
 *  The category is found by looking rather than derived, exactly as
 *  check-compliance.mjs's React branch finds a component's group; the stem is
 *  pascal(dir), because the file is `<Pascal>.behaviour.json` beside
 *  `<Pascal>.ts`. `tail` is `<category>/<dir>/<stem>.behaviour.json`, the path
 *  relative to `frameworks/angular/components` -- what a suite writes when it
 *  names its own binding, and what check:compliance searches a suite's text for.
 *  Callers need different halves and none may rebuild one it was not given: a
 *  right path with a wrong stem passes the read and then fails the coverage
 *  mention check for a filename that does not exist.
 *
 *  The category is resolved by FIRST MATCH, and nothing here rejects the same
 *  kebab directory appearing under two categories -- deliberately, because
 *  check:structure already does. Its category-mismatch rule reports a component
 *  sitting under a category `frameworks/Components.json` does not assign it to,
 *  so a second copy under a second category is named there and this function
 *  never has to arbitrate. Do not re-derive that worry:
 *  `validateStructure({categories:{display:['Tag'],feedback:['Alert']},
 *  layers:{angular:{display:['tag'],feedback:['tag','alert']}}})` reports
 *  "angular: Tag is in components/feedback/ but frameworks/Components.json
 *  assigns it to display".
 *
 *  Returns null when the directory holds no binding, which is check-behaviour's
 *  "every component declares" problem to report and not this function's.
 *  @param {string} root @param {string} dir kebab directory name
 *  @returns {{path: string, stem: string, tail: string}|null} */
export function angularBindingPath(root, dir) {
  const base = join(root, 'frameworks/angular/components');
  const stem = pascal(dir);
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const path = join(base, category.name, dir, `${stem}.behaviour.json`);
    if (existsSync(path)) return { path, stem, tail: `${category.name}/${dir}/${stem}.behaviour.json` };
  }
  return null;
}

/** The behaviour binding a React component directory holds, as
 *  `{path, stem, tail}` -- the ONE place the React layer's binding path is
 *  built, and the exact mirror of angularBindingPath above.
 *
 *  The category is found by looking rather than derived: a component's category
 *  is frameworks/Components.json's to declare and check:structure's to hold, and
 *  a second gate carrying it would be a second opinion nothing reconciles.
 *  `tail` is `<category>/<dir>/<stem>.behaviour.json`, relative to
 *  frameworks/react/components -- what a suite writes when it names its own
 *  binding. It is byte-identical in shape to Angular's, which is why
 *  check:compliance stopped discriminating by tail text (see SUITE_DIRS there).
 *  @param {string} root @param {string} dir kebab directory name
 *  @returns {{path: string, stem: string, tail: string} | null} */
export function reactBindingPath(root, dir) {
  const base = join(root, 'frameworks/react/components');
  const stem = pascal(dir);
  for (const category of readdirSync(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const tail = `${category.name}/${dir}/${stem}.behaviour.json`;
    const path = join(base, tail);
    if (existsSync(path)) return { path, stem, tail };
  }
  return null;
}
