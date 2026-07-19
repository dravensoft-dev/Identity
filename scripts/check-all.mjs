/* Runs every check gate and the test suite unconditionally — unlike the
 * `&&`-chain `bun run check` used to be, one gate failing does not stop the
 * rest from running. Each step's output streams live (child stdio is
 * inherited, not buffered), and a pass/fail summary prints once every step
 * has finished. Exit 1 if any step failed, 0 if all passed.
 *
 * Nine steps total: the eight gates in GATES below, plus the test suite.
 *
 * Every gate is spawned as `process.execPath <script>.mjs`, exactly how
 * scripts/lib/tailwind-compile.mjs spawns the Tailwind CLI, so the runner
 * behaves identically whether invoked as `bun scripts/check-all.mjs` or
 * `node scripts/check-all.mjs`. The test-suite step has no such uniform
 * invocation: `bun test` is a bun-specific subcommand with no `node:test`
 * equivalent of its own. This runner picks the command for the runtime it is
 * itself executing under — `bun test scripts/` when `process.versions.bun`
 * is set, `node --test` over the discovered `scripts/*.test.mjs` files
 * otherwise — so `bun run check` and a plain `node scripts/check-all.mjs`
 * both exercise the whole suite.
 *
 *   bun scripts/check-all.mjs    -> exit 0 if every step passed, 1 otherwise
 *   node scripts/check-all.mjs   -> same, under node
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

/** The check gates, each spawned as `process.execPath <file>`, in the same
 *  order `bun run check` used to chain them.
 *  @type {{name: string, file: string}[]} */
export const GATES = [
  { name: 'check:dtcg', file: 'check-dtcg.mjs' },
  { name: 'check:tokens', file: 'check-tokens-generated.mjs' },
  { name: 'check:ramp', file: 'check-ramp.mjs' },
  { name: 'check:tailwind', file: 'check-tailwind.mjs' },
  { name: 'check:coverage', file: 'check-tailwind-coverage.mjs' },
  { name: 'check:arbitrary', file: 'check-arbitrary-values.mjs' },
  { name: 'check:dimensions', file: 'check-dimension-literals.mjs' },
  { name: 'check:fonts', file: 'check-fonts-generated.mjs' },
];

/** The test-suite step for the runtime this process is executing under.
 *  `bun test` has no `node:test` equivalent invocation, so the two runtimes
 *  need different args to run the same `scripts/*.test.mjs` files.
 *  @param {{isBun: boolean, testFiles: string[]}} env
 *  @returns {{name: string, args: string[]}} */
export function testStep({ isBun, testFiles }) {
  if (isBun) return { name: 'test (bun test scripts/)', args: ['test', 'scripts'] };
  return { name: 'test (node --test scripts/*.test.mjs)', args: ['--test', ...testFiles] };
}

/** Format the pass/fail summary printed once every step has run.
 *  @param {{name: string, passed: boolean}[]} results @returns {string} */
export function summarize(results) {
  const lines = results.map((r) => `  ${r.passed ? 'PASS' : 'FAIL'}  ${r.name}`);
  const failed = results.filter((r) => !r.passed);
  const tail = failed.length
    ? `check-all: ${failed.length}/${results.length} step(s) failed`
    : `check-all: all ${results.length} step(s) passed`;
  return [...lines, '', tail].join('\n');
}

function runStep(name, args) {
  console.log(`\n> ${name}\n`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: repoRoot });
  if (r.error) console.error(`  failed to spawn: ${r.error.message || r.error}`);
  return { name, passed: r.status === 0 && !r.error };
}

function main() {
  const results = GATES.map(({ name, file }) => runStep(name, [join(here, file)]));

  const isBun = Boolean(process.versions.bun);
  const testFiles = readdirSync(join(repoRoot, 'scripts'))
    .filter((f) => f.endsWith('.test.mjs'))
    .sort()
    .map((f) => join(repoRoot, 'scripts', f));
  const { name: testName, args: testArgs } = testStep({ isBun, testFiles });
  results.push(runStep(testName, testArgs));

  console.log(`\n${'-'.repeat(60)}`);
  console.log(summarize(results));

  process.exit(results.some((r) => !r.passed) ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
