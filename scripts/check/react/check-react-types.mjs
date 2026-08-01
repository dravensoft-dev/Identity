/* The React layer answers to a compiler. It is the only gate that can catch a component
 * disagreeing with the interface beside it, which is what 54 hand-written .d.ts could not.
 * tsc runs under plain node, so unlike check:demos and check:vendor this gate never skips. */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

const MAX_BUFFER = 32 * 1024 * 1024;

export function tscBin(root = repoRoot) {
  const bin = join(root, 'node_modules/typescript/lib/tsc.js');
  if (!existsSync(bin))
    throw new Error(`typescript is not installed at ${bin} — run \`bun install\` before check:react-types`);
  return bin;
}

export const PROJECTS = [
  { project: 'frameworks/react/tsconfig.check.json', reaches: 'every component, helper and suite in the layer' },
];

export function typecheck(opts = {}) {
  const root = opts.root ?? repoRoot;
  const bin = tscBin(root);
  const project = join(root, opts.project ?? PROJECTS[0].project);
  const r = spawnSync(process.execPath, [bin, '--noEmit', '-p', project], { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (r.error) throw new Error(`tsc failed to spawn: ${r.error.message || r.error}`);
  return { status: r.status ?? 1, output: `${r.stdout || ''}${r.stderr || ''}` };
}

export function zeroProjectProblems(count) {
  if (count > 0) return [];
  return ['found 0 projects to typecheck; a gate that compiles nothing reports clean by construction'];
}

function main() {
  const empty = zeroProjectProblems(PROJECTS.length);
  for (const problem of empty) console.error(`check-react-types: ${problem}`);
  if (empty.length) process.exit(1);

  for (const { project, reaches } of PROJECTS) {
    let result;
    try {
      result = typecheck({ project });
    } catch (err) {
      console.error(`check-react-types: ${err.message}`);
      process.exit(1);
    }
    const { status, output } = result;
    if (status !== 0) {
      console.error(`check-react-types: ${project} does not typecheck — it reaches ${reaches}\n`);
      console.error(output.trim());
      process.exit(1);
    }
  }
  console.log(`check-react-types: ${PROJECTS.length} project(s) typecheck under strict`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
