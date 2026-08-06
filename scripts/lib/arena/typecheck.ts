/* Spawning tsc over a tsconfig, for the two gates that do it: check:react-types over
 * the React layer and check:script-types over the tooling itself. It sits in lib/
 * because a gate importing another domain's gate would make the domain grid a lie,
 * and lib/ is the one direction always allowed. Placed in arena/ by the vocabulary
 * rule: tsc and tsconfig belong to no single layer. check:angular keeps its own
 * runner, sharing the shape and none of the code, because ngc emits into a temporary
 * tree rather than checking in place. `projectFiles()` is here so a gate can prove its
 * project matched something: a tsconfig whose globs match nothing compiles nothing and
 * reports clean, which is the one way a typecheck gate passes over an unread tree. */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './repo-root.ts';

const MAX_BUFFER = 32 * 1024 * 1024;

type TypecheckOptions = { root?: string; project?: string };

export function tscBin(root = repoRoot) {
  const bin = join(root, 'node_modules/typescript/lib/tsc.js');
  if (!existsSync(bin))
    throw new Error(`typescript is not installed at ${bin}; run \`bun install\` before a typecheck gate`);
  return bin;
}

function runTsc(args, root) {
  const r = spawnSync(process.execPath, [tscBin(root), ...args], { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (r.error) throw new Error(`tsc failed to spawn: ${r.error.message || r.error}`);
  return { status: r.status ?? 1, output: `${r.stdout || ''}${r.stderr || ''}` };
}

export function typecheck(opts: TypecheckOptions = {}) {
  const root = opts.root ?? repoRoot;
  if (!opts.project) throw new Error('typecheck: no project given, and checking nothing reports nothing wrong');
  return runTsc(['--noEmit', '-p', join(root, opts.project)], root);
}

export function projectFiles(opts: TypecheckOptions = {}) {
  const root = opts.root ?? repoRoot;
  if (!opts.project) throw new Error('projectFiles: no project given, and checking nothing reports nothing wrong');
  const { status, output } = runTsc(['-p', join(root, opts.project), '--listFilesOnly'], root);
  if (status !== 0) throw new Error(`tsc could not read ${opts.project}:\n${output.trim()}`);
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
}

export function zeroProjectProblems(count) {
  if (count > 0) return [];
  return ['found 0 projects to typecheck; a gate that compiles nothing reports clean by construction'];
}
