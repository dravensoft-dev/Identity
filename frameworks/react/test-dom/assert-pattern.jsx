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

/** Resolve an id WITHIN the rendered tree, which is what an IDREF requirement
 *  claims -- resolving against the whole document would also find a container a
 *  previous test left behind, and would pass in a page where the id belongs to
 *  something else entirely.
 *
 *  It walks `[id]` and compares in JavaScript rather than building `#${id}`,
 *  because an id is legal in HTML in shapes that are a SyntaxError inside a CSS
 *  selector -- the colons `useId()` returns are the case this repo already paid
 *  for. A test tree is small enough that the walk costs nothing worth a bug.
 *
 *  `root` itself is searched as well as its descendants: querySelectorAll does
 *  not include the element it is called on, and an id can sit on the root. */
function resolverFor(root) {
  return (id) => {
    if (root.getAttribute && root.getAttribute('id') === id) return root;
    for (const el of root.querySelectorAll('[id]')) {
      if (el.getAttribute('id') === id) return el;
    }
    return null;
  };
}

/**
 * Assert a rendered tree against its behaviour binding, in both directions.
 * Throws with every disagreement listed, not just the first.
 *
 * @param {object} o
 * @param {HTMLElement} o.root the mounted container
 * @param {string} o.bindingPath absolute path to the component's *.behaviour.json
 * @param {Record<string, Element | Element[] | null>} [o.subjects] requirement key ->
 *   the element that must carry it, or -- for a requirement in QUANTIFIED -- every
 *   element it is about. The array form is not a convenience: a requirement whose
 *   prose quantifies over each of something THROWS when handed one element, because
 *   answering for a collection from its first member is the defect batch 8C7 exists
 *   to close. Note what it does not buy — the check reaches exactly the elements the
 *   suite's own selector collected, so one that renders without the attribute the
 *   selector keys on leaves the collection silently.
 *   The key `default` sets the element used for every
 *   requirement not named individually. The absence of the key and a `null` value
 *   under it are different claims and must stay different: omit `default`
 *   entirely to get the container's first element child as fallback; pass
 *   `default: someQuerySelectorResult` to use a real selector, and when that
 *   selector matched nothing (`null`), that `null` must reach comparePattern
 *   unchanged so its own "no subject element" diagnostic fires — collapsing it
 *   to the first-child fallback here would compare the wrong element and
 *   misreport a missed selector as an OVERCLAIM against it. A future Angular
 *   wrapper must keep this same distinction.
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
  // `??` here previously collapsed a present-but-null `default` (selector
  // matched nothing) into the same fallback as an absent one (caller named no
  // default at all), so a typo'd selector silently compared against
  // root.firstElementChild instead of surfacing comparePattern's own "no
  // subject element" diagnostic. `'default' in subjects` keeps the two cases
  // apart: present-and-null passes null through, absent falls back.
  const { default: fallbackSubject, ...perRequirement } = subjects;
  const fallback = 'default' in subjects ? fallbackSubject : root.firstElementChild;

  const problems = comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback,
    behavioural,
    resolveId: resolverFor(root),
  });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}
