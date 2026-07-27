/* The Angular layer's binding to comparePattern(): path constants, the two file
 * reads, and throwing on the result. The React wrapper at
 * frameworks/react/test-dom/assert-pattern.jsx is its mirror, and the comparison
 * itself is in neither of them -- it lives in
 * scripts/lib/behaviour-compliance.mjs, shared by both, because two copies of
 * this rule would be two places for it to drift and it is the layer's only real
 * guarantee.
 *
 * Only three things genuinely differ between the two wrappers, and all three are
 * here: where this layer's bindings live, the TypeScript typing, and the default
 * subject. An Angular primitive host-binds its root (`host: { '[class]':
 * 'styles().root()' }`), so the host element IS the styled and measured root --
 * the fixture's `nativeElement` itself, not its first element child, which is
 * what React's container-mounted tree makes the right default there.
 *
 * The shared evaluator is DOM-generic, which is what makes Angular's three ways
 * of authoring an attribute -- a template literal, `[attr.role]`, and a host
 * object entry -- indistinguishable here. In a rendered tree they are one
 * attribute. That is the whole reason this layer is a render suite and not the
 * text scan the spec proposed: check-dimension-literals.mjs still cannot see
 * `[style.x]`, and a behaviour scan would have inherited that blind spot.
 *
 * Both reads go through scripts/lib/behaviour-contracts.mjs rather than a local
 * JSON.parse, for the reason that file's own loadBinding comment gives: those are
 * the functions check:behaviour reads the same files with, and a suite reading
 * them a second way could pass while asserting against a shape the gate has
 * stopped agreeing with. */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// @ts-expect-error -- a plain .mjs helper with JSDoc types only; this suite runs
// under bun's own TypeScript stripping, and check:angular compiles only what
// index.ts reaches, so no declaration file is generated for it anywhere.
import { comparePattern } from '../../../scripts/lib/behaviour-compliance.mjs';
// @ts-expect-error -- same as above.
import { loadBinding, loadPatterns, bindingCases } from '../../../scripts/lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of frameworks/angular/primitives, so a suite can name a binding
 *  without counting `../` hops -- a wrong import depth has already cost this
 *  chain one review cycle. */
export const ANGULAR_PRIMITIVES = join(here, '..', 'primitives');

/** Absolute repo root, derived from this file rather than from cwd: a suite must
 *  assert the same thing whether `bun test` was run from the root or not. */
const REPO = join(here, '..', '..', '..');

/** Absolute path of behaviour/patterns. */
export const PATTERN_DIR = join(REPO, 'behaviour', 'patterns');

/** Every pattern, read once. `loadPatterns()` re-reads the whole directory per
 *  call and patterns do not change mid-process. */
let patternCache: Map<string, PatternFile> | null = null;

interface PatternFile {
  name: string;
  requires: Record<string, unknown>;
}

export interface AssertPatternOptions {
  /** The fixture's `nativeElement` -- the host, which for a primitive IS the
   *  styled root. */
  root: Element;
  /** Absolute path to the component's `*.behaviour.json`. */
  bindingPath: string;
  /** Requirement key -> the element that must carry it, or -- for a requirement
   *  in QUANTIFIED -- every element it is about. The key `default` sets the
   *  element used for every requirement not named individually.
   *
   *  The array form is not a convenience: a requirement whose prose quantifies
   *  over each of something THROWS when handed one element, because answering for
   *  a collection from its first member is the defect batch 8C7 exists to close.
   *  Note what the array does not buy — the check reaches exactly the elements the
   *  suite's own selector collected, so one that renders without the attribute the
   *  selector keys on leaves the collection silently.
   *
   *  The absence of that key and a `null` value under it are different claims and
   *  must stay different: omit `default` to fall back to the host, pass
   *  `default: someQuerySelectorResult` to use a real selector, and when that
   *  selector matched nothing (`null`) the `null` must reach `comparePattern`
   *  unchanged so its own "no subject element" diagnostic fires. Collapsing it to
   *  the host here would compare the wrong element and misreport a missed
   *  selector as an OVERCLAIM against it -- which invites fabricating an
   *  exception to silence it. React's wrapper shipped that defect with `??` and
   *  it is called out in its own comment; `'default' in subjects` is the fix, and
   *  this wrapper starts from it. */
  subjects?: Record<string, Element | Element[] | null>;
  /** Requirement key -> the verdict this suite's own behavioural test
   *  established: `true` = my test proved it met, `false` = proved unmet. */
  behavioural?: Record<string, boolean>;
}

/** Resolve an id WITHIN the rendered tree, which is what an IDREF requirement
 *  claims -- resolving against the whole document would also find a fixture an
 *  earlier test left behind, since this directory shares one document across
 *  its whole run (see testbed-env.ts).
 *
 *  It walks `[id]` and compares in JavaScript rather than building `#${id}`, and
 *  that is a correctness choice before it is a cost one: an id is legal in HTML in
 *  shapes that are a SyntaxError inside a CSS selector -- the colons React's
 *  `useId()` returns are the case this repo already paid for, and nothing stops an
 *  Angular fixture authoring one. Do not "optimise" this into a selector. The cost
 *  argument only says the walk is affordable: a test tree is small enough that it
 *  costs nothing worth a bug.
 *
 *  `root` itself is searched as well as its descendants, and here that is not
 *  optional: this wrapper's default subject IS the host (`root` is the
 *  fixture's `nativeElement`, not a container's first child the way React's
 *  is), so an id can sit on `root` itself rather than only ever appearing
 *  among its descendants. */
function resolverFor(root: Element): (id: string) => Element | null {
  return (id: string) => {
    if (root.getAttribute && root.getAttribute('id') === id) return root;
    for (const el of Array.from(root.querySelectorAll('[id]'))) {
      if (el.getAttribute('id') === id) return el;
    }
    return null;
  };
}

interface CompareOneOptions {
  root: Element;
  subjects: Record<string, Element | Element[] | null>;
  behavioural: Record<string, boolean>;
  pattern: PatternFile;
  binding: { exceptions?: unknown[] };
}

/** Shared by `assertPattern` and `assertPatternCases`: compute the fallback
 *  subject and call `comparePattern` once. Extracted because both call sites
 *  repeated this block near-verbatim -- a port of the same extraction in the
 *  React wrapper (assert-pattern.jsx's compareOne).
 *
 *  The `'default' in subjects` distinction must survive here exactly as it did
 *  at each call site: a present-but-null `default` means a selector matched
 *  nothing and must reach `comparePattern` as `null` unchanged, so its own "no
 *  subject element" diagnostic fires -- collapsing it to the fallback (e.g.
 *  with `??`) would misreport a missed selector as an OVERCLAIM against the
 *  wrong element.
 *
 *  The fallback is `root` itself, not `root.firstElementChild` the way the
 *  React wrapper's compareOne reads: an Angular primitive host-binds its root,
 *  so the host IS the styled and measured element -- the same reason
 *  `assertPattern` above already defaults to `root` rather than a child. */
function compareOne({ root, subjects, behavioural, pattern, binding }: CompareOneOptions): string[] {
  const { default: fallbackSubject, ...perRequirement } = subjects;
  const fallback = 'default' in subjects ? fallbackSubject : root;
  return comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback,
    behavioural,
    resolveId: resolverFor(root),
  });
}

/**
 * Assert a rendered Angular tree against its behaviour binding, in both
 * directions. Throws with every disagreement listed, not just the first.
 */
export function assertPattern({ root, bindingPath, subjects = {}, behavioural = {} }: AssertPatternOptions): void {
  const binding = loadBinding(bindingPath);
  patternCache ??= loadPatterns(REPO) as Map<string, PatternFile>;
  const pattern = patternCache.get(binding.pattern);
  if (!pattern) {
    // check:behaviour would catch this too, but it would catch it later and
    // elsewhere; a suite that silently compared against `undefined.requires`
    // would throw something far less legible than the binding's own name.
    throw new Error(`${bindingPath}\n  names pattern "${binding.pattern}", which has no file in ${PATTERN_DIR}`);
  }
  const problems = compareOne({ root, subjects, behavioural, pattern, binding });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}

interface BindingCase {
  name: string | null;
  when: string | null;
  pattern: string;
  reason: string | null;
  exceptions: unknown[];
}

export interface AssertPatternCasesOptions {
  /** Absolute path to the component's `*.behaviour.json`. */
  bindingPath: string;
  /** Case name -> a thunk that renders that case and returns its root (and,
   *  optionally, its subjects/behavioural maps). A thunk rather than a
   *  rendered root so nothing is mounted until its case is reached and the
   *  key sets have already been checked. */
  cases: Record<string, () => { root: Element; subjects?: Record<string, unknown>; behavioural?: Record<string, boolean> }>;
}

/** Assert a CASED binding, one call per declared case.
 *
 *  A port of the React wrapper's `assertPatternCases`, not a second design.
 *  The wrapper drives the loop rather than counting calls afterwards, and
 *  that is the whole mechanism: a suite handed the responsibility of calling
 *  once per case can forget, which is exactly how Skeleton verified its
 *  circle variant and claimed the component. Here a missing key is a missing
 *  key before anything renders.
 *
 *  `comparePattern` is called with a SYNTHESIZED binding carrying only this
 *  case's exceptions. The shared evaluator never learns what a case is -- it
 *  reads `binding.exceptions` and nothing else, so there was nothing there to
 *  teach. */
export function assertPatternCases({ bindingPath, cases }: AssertPatternCasesOptions): void {
  const binding = loadBinding(bindingPath);
  const declared: BindingCase[] = bindingCases(binding);
  if (declared.length === 1 && declared[0].name === null) {
    throw new Error(`${bindingPath}\n  declares no cases — assert it with assertPattern instead.`);
  }
  // validateBinding permits a binding to declare the same case name twice; the
  // gate-side fix for that is still owed. Object.keys(cases) can never carry a
  // duplicate, so comparing against a duplicated `want` list would produce a
  // confusing missing/unknown diff instead of naming the real problem. Catch
  // it here, before that comparison.
  const want = declared.map((c) => c.name);
  const seen = new Set<string | null>();
  const dupes = new Set<string | null>();
  for (const n of want) {
    if (seen.has(n)) dupes.add(n);
    seen.add(n);
  }
  if (dupes.size) {
    throw new Error(`${bindingPath}\n  declares the same case name more than once: ${[...dupes].join(', ')}`);
  }
  const got = Object.keys(cases);
  const missing = want.filter((n) => !got.includes(n as string));
  const unknown = got.filter((n) => !want.includes(n));
  if (missing.length || unknown.length) {
    throw new Error(
      `${bindingPath}\n  the suite must render every declared case, and only those.\n` +
      (missing.length ? `  - never rendered: ${missing.join(', ')}\n` : '') +
      (unknown.length ? `  - not declared in the binding: ${unknown.join(', ')}\n` : '') +
      `  declared: ${want.join(', ')}`,
    );
  }

  patternCache ??= loadPatterns(REPO) as Map<string, PatternFile>;
  const problems: string[] = [];
  for (const c of declared) {
    const pattern = patternCache.get(c.pattern);
    if (!pattern) {
      throw new Error(`${bindingPath}\n  case "${c.name}" names pattern "${c.pattern}", which has no file in ${PATTERN_DIR}`);
    }
    const { root, subjects = {}, behavioural = {} } = cases[c.name as string]();
    const found = compareOne({ root, subjects, behavioural, pattern, binding: { exceptions: c.exceptions } });
    for (const p of found) problems.push(`case "${c.name}" (${c.when}): ${p}`);
  }
  if (problems.length) {
    throw new Error(`${bindingPath}\n  - ${problems.join('\n  - ')}`);
  }
}
