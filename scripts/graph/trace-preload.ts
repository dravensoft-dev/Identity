/* The module a traced run loads before anything else. It writes once, on exit, rather than
 * appending per read: a gate calls process.exit() and the set is what the audit wants anyway, so
 * one write is both cheaper and the only shape that cannot be left half-written. */

import { createRequire } from 'node:module';
import { repoRoot } from '../lib/arena/repo-root.ts';
import { collector, install, TRACE_VAR } from './fs-trace.ts';

const path = process.env[TRACE_VAR];

if (path) {
  const required = createRequire(import.meta.url);
  const { record, flush } = collector(path);
  install(required('node:fs'), repoRoot, record);
  install(required('node:fs/promises'), repoRoot, record);
  process.on('exit', flush);
}
