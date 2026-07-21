/* Runs every check gate and the test suite unconditionally — unlike the
 * `&&`-chain `bun run check` used to be, one gate failing does not stop the
 * rest from running. Each step's output streams live (child stdio is
 * inherited, not buffered), and a pass/fail summary prints once every step
 * has finished. Exit 1 if any step failed, 0 if all passed.
 *
 * Thirteen steps total: the twelve gates in GATES below, plus the test suite.
 *
 * Two gates can report a third status. check:cards needs a headless browser,
 * and check:vendor needs Bun.build, neither of which is portable to plain
 * node; where either is missing it exits 2 and this runner marks it SKIP and
 * calls the whole run INCOMPLETE, so a missing dependency can never be
 * mistaken for a clean tree.
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
  { name: 'check:tailwind-generated', file: 'check-tailwind-generated.mjs' },
  { name: 'check:coverage', file: 'check-tailwind-coverage.mjs' },
  { name: 'check:arbitrary', file: 'check-arbitrary-values.mjs' },
  { name: 'check:dimensions', file: 'check-dimension-literals.mjs' },
  { name: 'check:fonts', file: 'check-fonts-generated.mjs' },
  { name: 'check:vendor', file: 'check-vendor-generated.mjs' },
  { name: 'check:cards', file: 'check-card-viewports.mjs' },
  { name: 'check:angular', file: 'check-angular.mjs' },
];

/** The test-suite step for the runtime this process is executing under.
 *  `bun test` has no `node:test` equivalent invocation, so the two runtimes
 *  need different args.
 *
 *  Under bun, all three suite roots run: scripts/, plus each framework
 *  layer's own test/ directory. Under node, only scripts/ does, and that
 *  asymmetry is deliberate rather than an oversight -- the framework suites
 *  import `.jsx` and `.ts` directly, which bun transpiles and plain node does
 *  not. Keeping the node path alive for scripts/ is what keeps every GATE
 *  runtime-portable; the framework suites simply are not, and pretending
 *  otherwise would mean a build step for tests.
 *  @param {{isBun: boolean, testFiles: string[]}} env
 *  @returns {{name: string, args: string[]}} */
export function testStep({ isBun, testFiles }) {
  if (isBun) return { name: 'test (bun test scripts/ + framework suites)', args: ['test', 'scripts', 'frameworks/react/test', 'frameworks/angular/test'] };
  return { name: 'test (node --test scripts/*.test.mjs)', args: ['--test', ...testFiles] };
}

/** A step's exit code as a status. Exit 2 is the loud skip
 *  check-card-viewports.mjs uses when there is no browser here; every other
 *  non-zero code, and a failure to spawn at all, is a failure.
 *  @param {number|null} code @returns {'pass'|'fail'|'skip'} */
export function stepStatus(code) {
  if (code === 0) return 'pass';
  if (code === 2) return 'skip';
  return 'fail';
}

/** Format the pass/fail/skip summary printed once every step has run.
 *  A skipped step never yields "all N passed": a gate that did not run is
 *  not a gate that agreed, and a run with one is INCOMPLETE.
 *  @param {{name: string, status: 'pass'|'fail'|'skip'}[]} results @returns {string} */
export function summarize(results) {
  const label = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };
  const lines = results.map((r) => `  ${label[r.status]}  ${r.name}`);
  const failed = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skip');

  let tail;
  if (failed.length) tail = `check-all: ${failed.length}/${results.length} step(s) failed`;
  else if (skipped.length) tail = `check-all: INCOMPLETE — ${results.length - skipped.length}/${results.length} step(s) passed, ${skipped.length} could not run here (see above)`;
  else tail = `check-all: all ${results.length} step(s) passed`;

  return [...lines, '', tail].join('\n');
}

function runStep(name, args) {
  console.log(`\n> ${name}\n`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: repoRoot });
  if (r.error) console.error(`  failed to spawn: ${r.error.message || r.error}`);
  return { name, status: r.error ? 'fail' : stepStatus(r.status) };
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

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
