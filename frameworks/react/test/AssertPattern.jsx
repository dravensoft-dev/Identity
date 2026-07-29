import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { comparePattern } from '../../../scripts/lib/behaviour-compliance.mjs';
import { loadBinding, loadPatterns, bindingCases } from '../../../scripts/lib/behaviour-contracts.mjs';

const here = dirname(fileURLToPath(import.meta.url));

export const REACT_COMPONENTS = join(here, '..', 'components');

const REPO = join(here, '..', '..', '..');

export const PATTERN_DIR = join(REPO, 'contracts', 'behaviour');

let patternCache = null;

function resolverFor(root) {
  return (id) => {
    if (root.getAttribute && root.getAttribute('id') === id) return root;
    for (const el of root.querySelectorAll('[id]')) {
      if (el.getAttribute('id') === id) return el;
    }
    return null;
  };
}

function labelResolverFor(root) {
  return (el) => {
    const id = el.getAttribute('id');
    if (id) {
      for (const candidate of root.querySelectorAll('label[for]')) {
        if (candidate.getAttribute('for') === id) return candidate;
      }
    }
    return typeof el.closest === 'function' ? el.closest('label') : null;
  };
}

function compareOne({ root, subjects, behavioural, pattern, binding }) {
  const { default: fallbackSubject, ...perRequirement } = subjects;
  const fallback = 'default' in subjects ? fallbackSubject : root.firstElementChild;
  return comparePattern({
    pattern,
    binding,
    subjects: perRequirement,
    fallback,
    behavioural,
    resolveId: resolverFor(root),
    resolveLabel: labelResolverFor(root),
  });
}

export function assertPattern({ root, bindingPath, subjects = {}, behavioural = {} }) {
  const binding = loadBinding(bindingPath);
  patternCache ??= loadPatterns(REPO);
  const pattern = patternCache.get(binding.pattern);
  if (!pattern) {

    throw new Error(`${bindingPath}\n  names pattern "${binding.pattern}", which has no file in ${PATTERN_DIR}`);
  }
  const problems = compareOne({ root, subjects, behavioural, pattern, binding });

  if (problems.length) {
    throw new Error(`${bindingPath}\n  pattern: ${pattern.name}\n  - ${problems.join('\n  - ')}`);
  }
}

export function assertPatternCases({ bindingPath, cases }) {
  const binding = loadBinding(bindingPath);
  const declared = bindingCases(binding);
  if (declared.length === 1 && declared[0].name === null) {
    throw new Error(`${bindingPath}\n  declares no cases — assert it with assertPattern instead.`);
  }

  const want = declared.map((c) => c.name);
  const seen = new Set();
  const dupes = new Set();
  for (const n of want) {
    if (seen.has(n)) dupes.add(n);
    seen.add(n);
  }
  if (dupes.size) {
    throw new Error(`${bindingPath}\n  declares the same case name more than once: ${[...dupes].join(', ')}`);
  }
  const got = Object.keys(cases);
  const missing = want.filter((n) => !got.includes(n));
  const unknown = got.filter((n) => !want.includes(n));
  if (missing.length || unknown.length) {
    throw new Error(
      `${bindingPath}\n  the suite must render every declared case, and only those.\n` +
      (missing.length ? `  - never rendered: ${missing.join(', ')}\n` : '') +
      (unknown.length ? `  - not declared in the binding: ${unknown.join(', ')}\n` : '') +
      `  declared: ${want.join(', ')}`,
    );
  }

  patternCache ??= loadPatterns(REPO);
  const problems = [];
  for (const c of declared) {
    const pattern = patternCache.get(c.pattern);
    if (!pattern) {
      throw new Error(`${bindingPath}\n  case "${c.name}" names pattern "${c.pattern}", which has no file in ${PATTERN_DIR}`);
    }
    const { root, subjects = {}, behavioural = {} } = cases[c.name]();
    const found = compareOne({ root, subjects, behavioural, pattern, binding: { exceptions: c.exceptions } });
    for (const p of found) problems.push(`case "${c.name}" (${c.when}): ${p}`);
  }
  if (problems.length) {
    throw new Error(`${bindingPath}\n  - ${problems.join('\n  - ')}`);
  }
}
