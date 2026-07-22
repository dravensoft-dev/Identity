/* Asserts every component declares a behaviour contract, in every layer, and
 * that every declaration is coherent.
 *
 * WHAT THIS PROVES: that a contract was DECLARED, that it names a pattern and
 * requirements that exist, and that the two framework layers agree or their
 * difference is written down.
 *
 * WHAT THIS DOES NOT PROVE, and the distinction matters more than the gate does:
 * that a component actually behaves as it declares. A component can bind
 * dialog-modal here and trap no focus at all. Verifying compliance is a later
 * plan's work -- a static scan of what the source implements, and render suites
 * that drive it. Do not read a green run as "the layers are accessible".
 *
 *   bun scripts/check-behaviour.mjs   -> exit 0 if every component declares
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  loadPatterns, validatePattern, validateBinding,
  reactComponents, angularPrimitives, PATTERN_DIR,
  validateUnboundPrimitives,
} from './lib/behaviour-contracts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** React components live in group directories; find the one holding a component. */
const REACT_GROUPS = ['brand', 'charts', 'display', 'feedback', 'forms', 'navigation'];
function reactBindingPath(component) {
  for (const group of REACT_GROUPS) {
    const path = join(root, 'frameworks/react/components', group, `${component}.behaviour.json`);
    if (existsSync(path)) return path;
  }
  return null;
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

async function main() {
  const problems = [];
  const patterns = loadPatterns(root);

  /* 1. Every pattern is well formed. */
  for (const [stem, pattern] of patterns) problems.push(...validatePattern(stem, pattern));

  /* 2. Every React component declares. */
  const react = new Map();
  for (const component of reactComponents(root)) {
    const path = reactBindingPath(component);
    if (!path) {
      problems.push(`react/${component}: no ${component}.behaviour.json — every component declares, including a presentational one`);
      continue;
    }
    const binding = read(path);
    problems.push(...validateBinding(component, 'react', binding, patterns));
    react.set(component, binding);
  }

  /* 3. Every Angular primitive declares. */
  const angular = new Map();
  for (const name of angularPrimitives(root)) {
    const path = join(root, 'frameworks/angular/primitives', name, `${name}.behaviour.json`);
    if (!existsSync(path)) {
      problems.push(`angular/${name}: no ${name}.behaviour.json`);
      continue;
    }
    const binding = read(path);
    problems.push(...validateBinding(name, 'angular', binding, patterns));
    if (binding.component && !react.has(binding.component)) {
      problems.push(`angular/${name}: component "${binding.component}" is not a React component — mistyped, or React dropped it`);
    }
    angular.set(binding.component ?? name, binding);
  }

  /* 3b. UNBOUND_PRIMITIVES itself stays honest: an entry naming a directory
   *     that vanished, or one that has since gained a behaviour.json (and so
   *     is bound, making the override redundant), fails the gate. */
  problems.push(...validateUnboundPrimitives(root));

  /* 4. Every React component Angular does NOT implement as a primitive is
   *    declared in the delegated file -- as provided by Material, or as
   *    genuinely absent. Coverage is EVERY layer, never "at least one": a
   *    component nobody declares for Angular is exactly the silence this gate
   *    exists to end.
   *
   *    "Angular does not implement it" and "Angular's binding for it did not
   *    parse" are different questions -- a primitive whose directory exists
   *    but has no behaviour.json yet is already reported by step 3's "no
   *    <name>.behaviour.json"; it must not ALSO be reported here as though no
   *    primitive existed at all. Every Angular primitive directory is bound
   *    now, so `angular` already carries every one of them by the time this
   *    step runs -- there is no longer an UNBOUND_PRIMITIVES-shaped gap to
   *    guard against here; the map's own self-check (step 3b) is what keeps
   *    that fact honest if a future primitive lands unbound. */
  const delegatedPath = join(root, 'frameworks/angular/behaviour-delegated.json');
  const delegated = existsSync(delegatedPath) ? read(delegatedPath) : {};
  for (const [component] of react) {
    if (angular.has(component)) continue;
    const entry = delegated[component];
    if (!entry) {
      problems.push(`angular/${component}: no primitive and no entry in behaviour-delegated.json — say whether Material provides it or nothing does`);
      continue;
    }
    problems.push(...validateBinding(component, 'angular-delegated', entry, patterns));
  }

  /* 5. Stale delegated entries: an entry for a component that now HAS a
   *    primitive, or that no longer exists in React at all. */
  for (const component of Object.keys(delegated)) {
    if (angular.has(component)) {
      problems.push(`angular/${component}: delegated entry is stale — an arena-* primitive now exists for it`);
    } else if (!react.has(component)) {
      problems.push(`angular/${component}: delegated entry names a component React no longer has`);
    }
  }

  /* 6. The two layers agree, or the difference is declared. */
  for (const [component, reactBinding] of react) {
    const other = angular.get(component) ?? delegated[component];
    if (!other) continue;
    if (other.pattern === reactBinding.pattern) continue;
    if (other.divergesFrom === reactBinding.pattern || reactBinding.divergesFrom === other.pattern) continue;
    problems.push(
      `${component}: react binds "${reactBinding.pattern}", angular binds "${other.pattern}", and neither declares divergesFrom.`
      + ` The PATTERN is the authority, not either layer — decide which is the defect.`,
    );
  }

  if (problems.length) {
    console.error(`check-behaviour: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `check-behaviour: ${patterns.size} pattern(s); ${react.size} react + ${angular.size} angular`
    + ` + ${Object.keys(delegated).length} delegated declaration(s), all coherent`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
