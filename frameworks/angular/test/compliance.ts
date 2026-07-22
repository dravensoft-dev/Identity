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
import { loadBinding, loadPatterns } from '../../../scripts/lib/behaviour-contracts.mjs';

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
  /** Requirement key -> the element that must carry it. The key `default` sets
   *  the element used for every requirement not named individually.
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
  subjects?: Record<string, Element | null>;
  /** Requirement key -> the verdict this suite's own behavioural test
   *  established: `true` = my test proved it met, `false` = proved unmet. */
  behavioural?: Record<string, boolean>;
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
  const { default: fallbackSubject, ...perRequirement } = subjects;
  const fallback = 'default' in subjects ? fallbackSubject : root;

  const problems: string[] = comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback,
    behavioural,
  });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}
