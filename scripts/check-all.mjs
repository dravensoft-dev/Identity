/* Runs every gate and the test suite unconditionally: one failure does not stop the
 * rest. A gate whose runtime dependency is missing exits 2 and is reported SKIP,
 * making the whole run INCOMPLETE rather than green.
 * testStep() below is the single authority for how the test suite is invoked. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

export const GATES = [
  { name: 'check:docs', file: 'check-docs.mjs' },
  { name: 'check:dtcg', file: 'check-dtcg.mjs' },
  { name: 'check:tokens', file: 'check-tokens-generated.mjs' },
  { name: 'check:script-tokens', file: 'check-script-tokens.mjs' },
  { name: 'check:duplicate-constants', file: 'check-duplicate-constants.mjs' },
  { name: 'check:ramp', file: 'check-ramp.mjs' },
  { name: 'check:tailwind', file: 'check-tailwind.mjs' },
  { name: 'check:tailwind-generated', file: 'check-tailwind-generated.mjs' },
  { name: 'check:coverage', file: 'check-tailwind-coverage.mjs' },
  { name: 'check:radius', file: 'check-radius-tokens.mjs' },
  { name: 'check:arbitrary', file: 'check-arbitrary-values.mjs' },
  { name: 'check:dimensions', file: 'check-dimension-literals.mjs' },
  { name: 'check:states', file: 'check-manifest-states.mjs' },
  { name: 'check:structure', file: 'check-structure.mjs' },
  { name: 'check:behaviour', file: 'check-behaviour.mjs' },
  { name: 'check:compliance', file: 'check-compliance.mjs' },
  { name: 'check:api', file: 'check-api.mjs' },
  { name: 'check:fonts', file: 'check-fonts-generated.mjs' },
  { name: 'check:vendor', file: 'check-vendor-generated.mjs' },
  { name: 'check:demos', file: 'check-demos-generated.mjs' },
  { name: 'check:cards', file: 'check-card-viewports.mjs' },
  { name: 'check:angular', file: 'check-angular.mjs' },
  { name: 'check:material', file: 'check-material.mjs' },
];

export function testStep({ isBun, testFiles }) {
  if (isBun) return [
    { name: 'build (ngc emit of the Angular test surface)', args: ['run', 'build:angular-tests'] },
    { name: 'test (bun test scripts/ + framework suites)',
      args: ['test', 'scripts', 'frameworks/react', 'build/angular-test/angular',
             '--path-ignore-patterns=**/*.dom.test.jsx'] },
    { name: 'test (React DOM suites, isolated)',
      args: ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.jsx'] },
  ];
  return [{ name: 'test (node --test scripts/*.test.mjs)', args: ['--test', ...testFiles] }];
}

export function stepStatus(code) {
  if (code === 0) return 'pass';
  if (code === 2) return 'skip';
  return 'fail';
}

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
  for (const { name, args } of testStep({ isBun, testFiles })) results.push(runStep(name, args));

  console.log(`\n${'-'.repeat(60)}`);
  console.log(summarize(results));

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
