/* The barrel is what a package consumer imports, so a component added without regenerating
 * it exists everywhere except where anyone can reach it. That is the failure the Angular
 * layer had for five primitives, found by a suite rather than by a person. This gate is the
 * React half: the file on disk equals a fresh run, and the run itself found something to
 * export. Pure node, no Bun API. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { buildBarrel, ROOT_PRIVATE, BARREL_TARGET, node as barrelNode } from '../../build/react/build-react-barrel.ts';

export const node = {
  name: 'check:react-barrel',
  reads: [...barrelNode.reads, BARREL_TARGET],
  writes: [],
  feeds: [],
};
import { repoRoot as root } from '../../lib/arena/repo-root.ts';

export function driftProblems(files: Map<string, string>, read: (path: string) => string) {
  const problems = [];
  for (const [rel, expected] of files) {
    let actual;
    try {
      actual = read(rel);
    } catch {
      problems.push(`${rel}: missing`);
      continue;
    }
    if (actual !== expected) problems.push(`${rel}: stale`);
  }
  return problems;
}

export function stalePrivateProblems(files: Map<string, string>) {
  const barrel = [...files.values()].join('\n');
  return [...ROOT_PRIVATE.keys()]
    .filter((name) => barrel.includes(`'./${name}`))
    .map((name) => `${name} is in ROOT_PRIVATE and the barrel exports it; one of the two is wrong`);
}

function main() {
  const { files, problems, count } = buildBarrel(root);
  const all = [
    ...problems,
    ...driftProblems(files, (rel: string) => readFileSync(join(root, rel), 'utf8')),
    ...stalePrivateProblems(files),
  ];

  if (all.length) {
    console.error(`check-react-barrel: ${all.length} problem(s)\n`);
    for (const problem of all) console.error(`  ${problem}`);
    console.error('\nRun: bun run build:react-barrel');
    process.exit(1);
  }
  console.log(`check-react-barrel: the barrel is in sync over ${count} component(s)`);
}

if (isMainModule(import.meta.url)) main();
