/* Holds frameworks/Catalog.generated.md equal to a fresh emit. The catalog is the one
 * document an agent reads to learn what Arena ships, and it is tracked rather than built,
 * because the plugin is served from the git tag where nothing runs a build. So a stale
 * copy is not a stale artefact: it is a wrong answer handed to every reader of that tag,
 * with every other gate green. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderCatalog, CATALOG_TARGET, loadCategories } from '../../generate/arena/generate-catalog.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

export function firstDifference(expected, actual) {
  const a = expected.split('\n');
  const b = actual.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) {
      return `line ${i + 1}: committed ${JSON.stringify(b[i] ?? '(end of file)')}, generated ${JSON.stringify(a[i] ?? '(end of file)')}`;
    }
  }
  return null;
}

export function zeroCatalogProblems(componentCount) {
  return componentCount === 0
    ? ['frameworks/Components.json declared no component, so this gate compared a catalog of nothing against a catalog of nothing']
    : [];
}

export function catalogProblems(base = root) {
  const declared = Object.values(loadCategories(base)).flat().length;
  const problems = zeroCatalogProblems(declared);

  const expected = renderCatalog(base);
  let actual;
  try {
    actual = readFileSync(join(base, CATALOG_TARGET), 'utf8');
  } catch {
    problems.push(`${CATALOG_TARGET}: missing, and the git tag hands this file to a reader directly`);
    return { problems, declared };
  }

  if (expected !== actual) {
    problems.push(`${CATALOG_TARGET}: stale, ${firstDifference(expected, actual)}`);
  }
  return { problems, declared };
}

function main() {
  const { problems, declared } = catalogProblems();
  if (problems.length > 0) {
    for (const problem of problems) console.error(`check-catalog: ${problem}`);
    console.error('\nRun: bun run generate:catalog');
    process.exit(1);
  }
  console.log(`check-catalog: ${CATALOG_TARGET} matches a fresh emit over ${declared} declared component(s)`);
}

if (process.argv[1] && process.argv[1].endsWith('check-catalog.mjs')) main();
