/* Holds every prompt's @api region equal to a fresh emit from the component's contract. A
 * prompt is the consumer's last stop, and the rest of it is hand-written prose no gate can
 * judge; this one region is the part a contract can hold, so a member renamed, retyped or
 * given a new default surfaces as a stale table rather than as silence. The fix is always the
 * contract and then bun run generate:api, never the table. Whether a component is contracted
 * at all is check:api's question, so an uncontracted one is counted here rather than failed. */

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { loadContract } from '../../generate/arena/generate-skills.ts';
import {
  renderRegion, promptPaths, OPEN_LINE, CLOSE_LINE,
} from '../../generate/arena/generate-prompt-api.ts';

export function regionOf(source: string) {
  const lines = source.split('\n');
  const opensAt = lines.findIndex((line) => OPEN_LINE.test(line));
  if (opensAt === -1) return null;
  const closesAt = lines.indexOf(CLOSE_LINE, opensAt);
  if (closesAt === -1) return null;
  return lines.slice(opensAt, closesAt + 1).join('\n');
}

export function promptProblems(base = root, prompts = promptPaths(base)) {
  const problems = [];
  let held = 0;
  let uncontracted = 0;

  for (const { component, layer, path } of prompts) {
    const contract = loadContract(component, base);
    if (!contract) { uncontracted += 1; continue; }

    const found = regionOf(readFileSync(join(base, path), 'utf8'));
    if (found === null) {
      problems.push(`${path}: carries no @api region, and ${component} is contracted. `
        + 'Run bun run generate:api, which places one after the first example');
      continue;
    }
    const expected = renderRegion(contract, layer);
    if (found !== expected) {
      problems.push(`${path}: its @api region does not match the contract. `
        + 'Fix contracts/api/components/' + `${component}.json and run bun run generate:api`);
      continue;
    }
    held += 1;
  }

  return { problems, held, uncontracted, scanned: prompts.length };
}

export function zeroScanProblems(scanned: number) {
  return scanned === 0
    ? ['found no .prompt.md at all, so this gate compared nothing against nothing']
    : [];
}

function main() {
  const { problems, held, uncontracted, scanned } = promptProblems();
  const all = [...zeroScanProblems(scanned), ...problems];
  if (all.length > 0) {
    for (const problem of all) console.error(`check-prompts: ${problem}`);
    console.error(`\ncheck-prompts: ${all.length} problem(s)`);
    process.exit(1);
  }
  console.log(
    `check-prompts: ${held} prompt(s) carry an @api region equal to their contract`
    + (uncontracted > 0 ? `; ${uncontracted} name a component no contract covers` : ''),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
