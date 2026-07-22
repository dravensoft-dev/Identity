/* The React layer's binding to comparePattern(): path constants, the two file
 * reads, and throwing on the result.
 *
 * The comparison itself is NOT here. It lives in
 * scripts/lib/behaviour-compliance.mjs, shared with the Angular suites and
 * unit-tested there against stub elements. Two copies of this rule would be two
 * places for it to drift, and it is the layer's only real guarantee. What is
 * genuinely layer-specific is exactly what remains below: where this layer's
 * bindings live, and how deep the import is.
 *
 * Both reads go through scripts/lib/behaviour-contracts.mjs — loadBinding and
 * loadPatterns — rather than a local JSON.parse, for the same reason: those are
 * the functions check:behaviour reads the same files with, and a suite reading
 * them a second way could pass while asserting against a shape the gate has
 * stopped agreeing with. */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { comparePattern } from '../../../scripts/lib/behaviour-compliance.mjs';
import { loadBinding, loadPatterns } from '../../../scripts/lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path of frameworks/react/components, so a suite can name a binding
 *  without counting `../` hops — a wrong import depth has already cost this chain
 *  one review cycle. */
export const REACT_COMPONENTS = join(here, '..', 'components');

/** Absolute repo root, derived from this file rather than from cwd: a suite must
 *  assert the same thing whether `bun test` was run from the root or not. */
const REPO = join(here, '..', '..', '..');

/** Absolute path of behaviour/patterns. */
export const PATTERN_DIR = join(REPO, 'behaviour', 'patterns');

/** Every pattern, read once. loadPatterns() re-reads the whole directory per
 *  call, and Tasks 4-6 call assertPattern once per component; caching keeps that
 *  from being 19 file reads apiece. Patterns do not change mid-process.
 *  @type {Map<string, object> | null} */
let patternCache = null;

/**
 * Assert a rendered tree against its behaviour binding, in both directions.
 * Throws with every disagreement listed, not just the first.
 *
 * @param {object} o
 * @param {HTMLElement} o.root the mounted container
 * @param {string} o.bindingPath absolute path to the component's *.behaviour.json
 * @param {Record<string, Element | null>} [o.subjects] requirement key -> the element
 *   that must carry it. The key `default` sets the element used for every
 *   requirement not named individually; without it, the container's first element
 *   child is used.
 * @param {Record<string, boolean>} [o.behavioural] requirement key -> the verdict this
 *   suite's own behavioural test established (true = proved met, false = proved unmet).
 */
export function assertPattern({ root, bindingPath, subjects = {}, behavioural = {} }) {
  const binding = loadBinding(bindingPath);
  patternCache ??= loadPatterns(REPO);
  const pattern = patternCache.get(binding.pattern);
  if (!pattern) {
    // check:behaviour would catch this too, but it would catch it later and
    // elsewhere; a suite that silently compared against `undefined.requires`
    // would throw something far less legible than the binding's own name.
    throw new Error(`${bindingPath}\n  names pattern "${binding.pattern}", which has no file in ${PATTERN_DIR}`);
  }
  const { default: fallbackSubject, ...perRequirement } = subjects;

  const problems = comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback: fallbackSubject ?? root.firstElementChild,
    behavioural,
  });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}
