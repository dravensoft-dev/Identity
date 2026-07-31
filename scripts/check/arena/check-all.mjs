/* Runs every gate and the test suite unconditionally: one failure does not stop the
 * rest. A gate whose runtime dependency is missing exits 2 and is reported SKIP,
 * making the whole run INCOMPLETE rather than green.
 * testStep() below is the single authority for how the test suite is invoked. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { repoRoot } from '../../lib/repo-root.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const checkRoot = join(here, '..');

export const DOMAINS = ['core', 'react', 'angular', 'tailwind', 'arena'];

export const GATES = [
  { name: 'check:docs', file: 'arena/check-docs.mjs' },
  { name: 'check:dtcg', file: 'core/check-dtcg.mjs' },
  { name: 'check:tokens', file: 'core/check-tokens-generated.mjs' },
  { name: 'check:script-tokens', file: 'arena/check-script-tokens.mjs' },
  { name: 'check:duplicate-constants', file: 'arena/check-duplicate-constants.mjs' },
  { name: 'check:ramp', file: 'core/check-ramp.mjs' },
  { name: 'check:tailwind', file: 'tailwind/check-tailwind.mjs' },
  { name: 'check:tailwind-generated', file: 'tailwind/check-tailwind-generated.mjs' },
  { name: 'check:coverage', file: 'tailwind/check-tailwind-coverage.mjs' },
  { name: 'check:radius', file: 'tailwind/check-radius-tokens.mjs' },
  { name: 'check:arbitrary', file: 'tailwind/check-arbitrary-values.mjs' },
  { name: 'check:dimensions', file: 'arena/check-dimension-literals.mjs' },
  { name: 'check:states', file: 'arena/check-manifest-states.mjs' },
  { name: 'check:structure', file: 'arena/check-structure.mjs' },
  { name: 'check:behaviour', file: 'arena/check-behaviour.mjs' },
  { name: 'check:compliance', file: 'arena/check-compliance.mjs' },
  { name: 'check:api', file: 'arena/check-api.mjs' },
  { name: 'check:fonts', file: 'core/check-fonts-generated.mjs' },
  { name: 'check:vendor', file: 'react/check-vendor-generated.mjs' },
  { name: 'check:demos', file: 'react/check-demos-generated.mjs' },
  { name: 'check:cards', file: 'arena/check-card-viewports.mjs' },
  { name: 'check:angular', file: 'angular/check-angular.mjs' },
  { name: 'check:angular-demos', file: 'angular/check-angular-demos.mjs' },
  { name: 'check:assertions', file: 'angular/check-assertions.mjs' },
  { name: 'check:cdk', file: 'angular/check-cdk.mjs' },
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

export function testFilesUnder(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...testFilesUnder(full));
    else if (entry.name.endsWith('.test.mjs')) found.push(full);
  }
  return found;
}

function main() {
  const results = GATES.map(({ name, file }) => runStep(name, [join(checkRoot, file)]));

  const isBun = Boolean(process.versions.bun);
  const testFiles = testFilesUnder(join(repoRoot, 'scripts')).sort();
  for (const { name, args } of testStep({ isBun, testFiles })) results.push(runStep(name, args));

  console.log(`\n${'-'.repeat(60)}`);
  console.log(summarize(results));

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
