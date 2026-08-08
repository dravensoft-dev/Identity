/* Runs a node under the tracer and reports what FILES it opened and does not declare. A directory
 * it listed is not one of them: a digest is over the sorted list of path and hash pairs, so a file
 * appearing under a directory a spec reaches already moves the fingerprint, and the listing needs
 * no row of its own. This answers the
 * question check:graph cannot: that gate holds the edges BETWEEN declarations, so it finds a reader
 * nobody subscribed, and a `reads` that is too narrow leaves no disagreement to find. A file no node
 * claims is a file every declaration agrees is nobody's business, and only a run is a witness.
 * A spawned process is invisible to the tracer, so a node that spawns one is reported unaudited and
 * never clean: measuring nothing and finding nothing have to read differently. */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../lib/arena/repo-root.ts';
import { matchesSpec } from './pathspecs.ts';
import { TRACE_VAR, traceFile } from './fs-trace.ts';
import type { GraphNode } from './graph.ts';

export const UNTRACEABLE = new Map([
  ['check:react-types', 'it spawns tsc, and the compiler opens the layer in the other process'],
  ['check:angular', 'it spawns ngc once per project, and the compiler opens the layer in there'],
  ['check:angular-demos', 'it reads what ngc emitted, and ngc ran elsewhere'],
  ['check:cards', 'it drives a browser, which fetches over a socket rather than opening a file'],
  ['check:focus-trap', 'it drives a browser, which fetches over a socket rather than opening a file'],
  ['check:playgrounds', 'its second half drives a browser'],
  ['check:style-parity', 'it drives a browser over a page it wrote'],
  ['check:consumer', 'it runs the shipped CLI in a scratch project, in another process'],
  ['check:packages', 'it reads dist/, which ng-packagr and the React emit wrote in other processes'],
  ['build:tailwind', 'it compiles through Tailwind, which resolves its own imports'],
  ['build:angular-demo', 'it spawns ngc and then bundles'],
  ['build:angular-tests', 'it spawns ngc, which reads the layer in a process this cannot enter'],
  ['build:angular-package', 'it spawns ng-packagr, which resolves and reads the layer itself'],
  ['build:react-package', 'it spawns tsc, which reads the layer in a process this cannot enter'],
]);

export const NOT_AN_INPUT = [
  '.cache/**/*', 'node_modules/**/*', '.git/**/*', 'scripts/**/*',
];

export const isDirectory = (root: string, rel: string) => {
  try { return statSync(join(root, rel)).isDirectory(); } catch { return false; }
};

export function undeclaredReads(node: GraphNode, opened: string[], root = repoRoot) {
  return opened
    .filter((rel) => !isDirectory(root, rel))
    .filter((rel) => !NOT_AN_INPUT.some((spec) => matchesSpec(spec, rel)))
    .filter((rel) => ![...node.reads, ...node.writes]
      .some((spec) => matchesSpec(spec.replace(/^!/, ''), rel)))
    .sort();
}

export function traceRun(script: string, name: string, root = repoRoot) {
  const path = traceFile(root, name);
  rmSync(path, { force: true });
  const result = spawnSync(
    process.execPath,
    ['--preload', join(root, 'scripts/graph/trace-preload.ts'), join(root, script)],
    { cwd: root, stdio: 'ignore', env: { ...process.env, [TRACE_VAR]: path } },
  );
  const opened = existsSync(path) ? readFileSync(path, 'utf8').split('\n').filter(Boolean) : [];
  return { status: result.status, opened };
}

export function auditProblems(node: GraphNode, script: string, root = repoRoot) {
  const reason = UNTRACEABLE.get(node.name);
  if (reason) return { unaudited: reason, undeclared: [] as string[], opened: 0 };

  const { opened } = traceRun(script, node.name, root);
  if (opened.length === 0) {
    return {
      unaudited: 'the tracer recorded no read at all, and a gate that opens nothing is not a gate',
      undeclared: [] as string[],
      opened: 0,
    };
  }
  return { unaudited: null, undeclared: undeclaredReads(node, opened, root), opened: opened.length };
}
