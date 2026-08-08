import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { readJson } from '../../utils/read-file.ts';
import {
  loadPatterns, validatePattern, validateBinding,
  reactComponents, reactBindingPath, angularPrimitives, angularBindingPath,
  crossLayerAgrees, bindingCases, PATTERN_DIR,
} from '../../lib/arena/behaviour-contracts.ts';
import type { BehaviourBinding } from '../../lib/arena/behaviour-contracts.ts';
import { pascal, kebab } from '../../utils/case.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export const node = {
  name: 'check:behaviour',
  reads: [
    'contracts/behaviour', 'frameworks/Components.json',
    'frameworks/react/components/**', 'frameworks/angular/components/**',
    'frameworks/angular/BehaviourDelegated.json',
  ],
  writes: [],
  feeds: [],
};


export function describeBinding(binding: BehaviourBinding) {
  return bindingCases(binding)
    .map((c) => (c.name ? `${c.name}:${c.pattern}` : c.pattern))
    .join(' + ');
}

export function zeroPatternProblems(count: number) {
  if (count > 0) return [];
  return [`found 0 patterns in ${PATTERN_DIR} — an empty result set is a failure, not a clean pass; check the discovery path`];
}

async function main() {
  const problems = [];
  const patterns = loadPatterns(root);
  problems.push(...zeroPatternProblems(patterns.size));
  if (patterns.size === 0) {
    console.error(`check-behaviour: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  for (const [stem, pattern] of patterns) problems.push(...validatePattern(stem, pattern));

  const react = new Map();
  for (const component of reactComponents(root)) {

    const found = reactBindingPath(root, kebab(component));
    if (!found) {
      problems.push(`react/${component}: no ${component}.behaviour.json — every component declares, including a presentational one`);
      continue;
    }
    const binding = readJson(found.path);
    problems.push(...validateBinding(component, 'react', binding, patterns));
    react.set(component, binding);
  }

  const angular = new Map();
  for (const name of angularPrimitives(root)) {

    const found = angularBindingPath(root, name);
    if (!found) {
      problems.push(`angular/${name}: no ${pascal(name)}.behaviour.json`);
      continue;
    }
    const binding = readJson(found.path);
    problems.push(...validateBinding(name, 'angular', binding, patterns));
    if (binding.component && !react.has(binding.component)) {
      problems.push(`angular/${name}: component "${binding.component}" is not a React component — mistyped, or React dropped it`);
    }
    angular.set(binding.component ?? name, binding);
  }

  const delegatedPath = join(root, 'frameworks/angular/BehaviourDelegated.json');
  const delegated = existsSync(delegatedPath) ? readJson(delegatedPath) : {};
  for (const [component] of react) {
    if (angular.has(component)) continue;
    const entry = delegated[component];
    if (!entry) {
      problems.push(`angular/${component}: no primitive and no entry in BehaviourDelegated.json — build the primitive, or record it there binding "absent"`);
      continue;
    }
    problems.push(...validateBinding(component, 'angular-delegated', entry, patterns));
  }

  for (const component of Object.keys(delegated)) {
    if (angular.has(component)) {
      problems.push(`angular/${component}: delegated entry is stale — an arena-* primitive now exists for it`);
    } else if (!react.has(component)) {
      problems.push(`angular/${component}: delegated entry names a component React no longer has`);
    }
  }

  for (const [component, reactBinding] of react) {
    const other = angular.get(component) ?? delegated[component];
    if (!other) continue;
    if (crossLayerAgrees(reactBinding, other)) continue;
    problems.push(
      `${component}: react binds "${describeBinding(reactBinding)}", angular binds "${describeBinding(other)}", and neither declares divergesFrom.`
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

if (isMainModule(import.meta.url)) await main();
