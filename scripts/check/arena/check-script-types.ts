/* The tooling answers to a compiler, which nothing under scripts/ did before. The project
 * is deliberately loose while the tree is mixed: a .mjs is resolved and never checked, so
 * what this holds today is that every .ts under scripts/ typechecks and that none of them
 * reaches for syntax bare node cannot strip, which is what keeps a script runnable by both
 * runtimes check-all targets. It tightens to strict once the last .mjs is gone. A tsconfig
 * whose globs match nothing compiles nothing and reports clean, so this counts what the
 * project actually reached against what is on disk rather than trusting the globs. */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { typecheck, projectFiles, zeroProjectProblems } from '../../lib/arena/typecheck.ts';

export const PROJECTS = [
  { project: 'scripts/tsconfig.check.json',
    reaches: 'every script and suite under scripts/, and the tailwind modules two of them import' },
];

export const CHECKED_EXTENSIONS = ['.ts', '.mjs'];

export function sourcesUnder(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { found.push(...sourcesUnder(full)); continue; }
    if (CHECKED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) found.push(full);
  }
  return found;
}

export function unreachedProblems(onDisk, included, root = repoRoot) {
  const reached = new Set(included);
  return onDisk
    .filter((path) => !reached.has(path))
    .map((path) => `${relative(root, path)} is on disk and the project's globs do not reach it`);
}

function main() {
  const empty = zeroProjectProblems(PROJECTS.length);
  for (const problem of empty) console.error(`check-script-types: ${problem}`);
  if (empty.length) process.exit(1);

  for (const { project, reaches } of PROJECTS) {
    let unreached;
    try {
      unreached = unreachedProblems(sourcesUnder(join(repoRoot, 'scripts')), projectFiles({ project }));
    } catch (err) {
      console.error(`check-script-types: ${err.message}`);
      process.exit(1);
    }
    if (unreached.length) {
      console.error(`check-script-types: ${project} leaves ${unreached.length} file(s) unchecked\n`);
      for (const problem of unreached) console.error(`  ${problem}`);
      process.exit(1);
    }

    let result;
    try {
      result = typecheck({ project });
    } catch (err) {
      console.error(`check-script-types: ${err.message}`);
      process.exit(1);
    }
    if (result.status !== 0) {
      console.error(`check-script-types: ${project} does not typecheck -- it reaches ${reaches}\n`);
      console.error(result.output.trim());
      process.exit(1);
    }
  }
  console.log(`check-script-types: ${PROJECTS.length} project(s) typecheck, reaching every source under scripts/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
