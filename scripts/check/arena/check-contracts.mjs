/* contracts/README.md states a shape -- three levels, one normative document each, one
 * generated sibling, and an inner directory only where it separates two vocabularies a gate
 * reads as two sets. Nothing checked any of it: a stray file, a level missing its README, or
 * a fourth directory beside the three passed every gate. check:structure is the analogue for
 * frameworks/ and had no counterpart here. */

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

export const LEVELS = ['api', 'behaviour', 'design'];
export const GENERATED = 'design-generated';

export const SHAPE = new Map([
  ['api', { dirs: ['components', 'types'], files: ['README.md'], ext: null }],
  ['behaviour', { dirs: [], files: ['README.md'], ext: '.json' }],
  ['design', { dirs: [], files: ['README.md', 'colors.css', 'reset.css'], ext: '.json' }],
]);

export function rootProblems(entries) {
  const problems = [];
  const expected = new Set([...LEVELS, GENERATED, 'README.md']);
  for (const name of entries) {
    if (!expected.has(name)) {
      problems.push(
        `contracts/${name} is not one of the three levels, their generated sibling, or the roof README. `
        + `contracts/README.md names exactly ${[...expected].sort().join(', ')} -- add it there with its reason, or move it.`,
      );
    }
  }
  for (const name of expected) {
    if (!entries.includes(name)) problems.push(`contracts/${name} is missing, and contracts/README.md says it is there.`);
  }
  return problems;
}

export function levelProblems(level, entries, isDir) {
  const problems = [];
  const shape = SHAPE.get(level);
  if (!shape) return [`contracts/${level}: no declared shape`];
  for (const name of entries) {
    if (isDir(name)) {
      if (!shape.dirs.includes(name)) {
        problems.push(
          `contracts/${level}/${name}/ is an inner directory contracts/README.md does not declare. `
          + `An inner directory is earned, never assumed: add one only when it separates two vocabularies a gate reads as two sets.`,
        );
      }
      continue;
    }
    if (shape.files.includes(name)) continue;
    if (shape.ext && name.endsWith(shape.ext)) continue;
    problems.push(
      `contracts/${level}/${name} is neither ${shape.files.join(' nor ')}${shape.ext ? ` nor a ${shape.ext} source` : ''}. `
      + `A stray file in a contract level is invisible to every gate that reads the level by extension.`,
    );
  }
  for (const name of [...shape.files, ...shape.dirs]) {
    if (!entries.includes(name)) {
      problems.push(`contracts/${level}/${name} is missing. contracts/README.md names it as this level's ${shape.dirs.includes(name) ? 'vocabulary directory' : 'normative document'}.`);
    }
  }
  return problems;
}

export function generatedProblems(entries) {
  const problems = [];
  for (const name of entries) {
    if (!name.endsWith('.generated.css')) {
      problems.push(
        `contracts/${GENERATED}/${name} carries no .generated. infix. Everything in this directory is build output `
        + `and the name is what says so -- check:docs reads the name and never opens the file.`,
      );
    }
  }
  return problems;
}

export function zeroContractLevelProblems(count) {
  if (count > 0) return [];
  return [`found 0 entries under contracts/ -- an empty result set is a failure, not a clean pass; check the discovery path`];
}

function main() {
  const base = join(root, 'contracts');
  const entries = readdirSync(base).sort();
  const problems = [...zeroContractLevelProblems(entries.length), ...rootProblems(entries)];

  let counted = 0;
  for (const level of LEVELS) {
    let names;
    try {
      names = readdirSync(join(base, level)).sort();
    } catch {
      continue;
    }
    counted += names.length;
    problems.push(...levelProblems(level, names, (n) => statSync(join(base, level, n)).isDirectory()));
  }
  let generated = [];
  try {
    generated = readdirSync(join(base, GENERATED)).sort();
  } catch {
    generated = [];
  }
  counted += generated.length;
  problems.push(...generatedProblems(generated));

  problems.push(...zeroContractLevelProblems(counted));

  if (problems.length) {
    console.error(`check-contracts: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-contracts: ${LEVELS.length} level(s) plus ${GENERATED}/ hold the shape contracts/README.md describes, across ${counted} entries`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
