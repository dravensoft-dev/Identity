/* Runs the selected gates and the test suite: one failure does not stop the rest, and with
 * no argument the selection is every domain, which is what `bun run check` gets. A gate whose
 * runtime dependency is missing exits 2 and is reported SKIP, making the run INCOMPLETE.
 * testStep() below is the single authority for how the test suite is invoked, and why it is
 * two bun processes: --preload installs happy-dom PROCESS-wide, and a DOM installed for a
 * whole invocation also replaces Bun's own fetch, which turns
 * scripts/lib/arena/static-server.test.ts's fetch assertion into a cross-origin failure --
 * so scripts/ rides the DOM-free invocation, not the preloaded one. The Angular emit is safe
 * in either: its TestBed registration site is guarded rather than throwing on a second call.
 * Read the args here, never reconstruct them. */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { DOMAINS, isSuite } from '../../lib/arena/domains.ts';

const here = dirname(fileURLToPath(import.meta.url));
const checkRoot = join(here, '..');

export { DOMAINS };

export const GATES = [
  { name: 'check:docs', file: 'arena/check-docs.ts' },
  { name: 'check:generated', file: 'arena/check-generated.ts' },
  { name: 'check:skills', file: 'arena/check-skills.ts' },
  { name: 'check:prompts', file: 'arena/check-prompts.ts' },
  { name: 'check:dtcg', file: 'core/check-dtcg.ts' },
  { name: 'check:tokens', file: 'core/check-tokens-generated.ts' },
  { name: 'check:script-tokens', file: 'arena/check-script-tokens.ts' },
  { name: 'check:duplicate-constants', file: 'arena/check-duplicate-constants.ts' },
  { name: 'check:ramp', file: 'core/check-ramp.ts' },
  { name: 'check:text-contrast', file: 'core/check-text-contrast.ts' },
  { name: 'check:tailwind', file: 'tailwind/check-tailwind.ts' },
  { name: 'check:tailwind-generated', file: 'tailwind/check-tailwind-generated.ts' },
  { name: 'check:coverage', file: 'tailwind/check-tailwind-coverage.ts' },
  { name: 'check:surface-parity', file: 'tailwind/check-surface-parity.ts' },
  { name: 'check:radius', file: 'tailwind/check-radius-tokens.ts' },
  { name: 'check:arbitrary', file: 'tailwind/check-arbitrary-values.ts' },
  { name: 'check:component-css', file: 'tailwind/check-component-css.ts' },
  { name: 'check:style-parity', file: 'tailwind/check-style-parity.ts' },
  { name: 'check:dimensions', file: 'arena/check-dimension-literals.ts' },
  { name: 'check:states', file: 'arena/check-manifest-states.ts' },
  { name: 'check:appearance', file: 'arena/check-appearance.ts' },
  { name: 'check:layer-independence', file: 'arena/check-layer-independence.ts' },
  { name: 'check:structure', file: 'arena/check-structure.ts' },
  { name: 'check:contracts', file: 'arena/check-contracts.ts' },
  { name: 'check:behaviour', file: 'arena/check-behaviour.ts' },
  { name: 'check:compliance', file: 'arena/check-compliance.ts' },
  { name: 'check:api', file: 'arena/check-api.ts' },
  { name: 'check:playgrounds', file: 'arena/check-playgrounds.ts' },
  { name: 'check:citations', file: 'arena/check-citations.ts' },
  { name: 'check:agents', file: 'arena/check-agents.ts' },
  { name: 'check:icons', file: 'arena/check-icons.ts' },
  { name: 'check:fonts', file: 'core/check-fonts-generated.ts' },
  { name: 'check:intro', file: 'arena/check-intro-generated.ts' },
  { name: 'check:vendor', file: 'react/check-vendor-generated.ts' },
  { name: 'check:demos', file: 'react/check-demos-generated.ts' },
  { name: 'check:react-barrel', file: 'react/check-react-barrel.ts' },
  { name: 'check:react-types', file: 'react/check-react-types.ts' },
  { name: 'check:script-types', file: 'arena/check-script-types.ts' },
  { name: 'check:cards', file: 'arena/check-card-viewports.ts' },
  { name: 'check:focus-trap', file: 'arena/check-focus-trap.ts' },
  { name: 'check:shared-arithmetic', file: 'arena/check-shared-arithmetic.ts' },
  { name: 'check:packages', file: 'arena/check-packages.ts' },
  { name: 'check:consumer', file: 'arena/check-consumer.ts' },
  { name: 'check:angular', file: 'angular/check-angular.ts' },
  { name: 'check:angular-demos', file: 'angular/check-angular-demos.ts' },
  { name: 'check:assertions', file: 'angular/check-assertions.ts' },
  { name: 'check:cdk', file: 'angular/check-cdk.ts' },
];

export function gatesFor(domains) {
  const unknown = domains.filter((d) => !DOMAINS.includes(d));
  if (unknown.length > 0) {
    throw new Error(`check-all: no domain called ${unknown.join(', ')}; the five are ${DOMAINS.join(', ')}`);
  }
  const selected = GATES.filter((g) => domains.includes(g.file.split('/')[0]));
  if (selected.length === 0) {
    throw new Error(`check-all: ${domains.join(', ')} selected no gate, and a run of nothing reports nothing wrong with everything`);
  }
  return selected;
}

export function parseCheckArgs(argv) {
  let domains = DOMAINS;
  let tests = true;
  for (const arg of argv) {
    if (arg === '--no-tests') { tests = false; continue; }
    if (arg.startsWith('--domain=')) {
      domains = arg.slice('--domain='.length).split(',').map((d) => d.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`check-all: unrecognised argument "${arg}"; it takes --domain=<a,b> and --no-tests`);
  }
  return { domains, tests };
}

export function testStep({ isBun, testFiles }) {
  if (isBun) return [
    { name: 'build (ngc emit of the Angular test surface)', args: ['run', 'build:angular-tests'] },
    { name: 'test (bun test scripts/ + framework suites)',
      args: ['test', 'scripts', 'frameworks/react', 'frameworks/angular/build/test',
             '--path-ignore-patterns=**/*.dom.test.*'] },
    { name: 'test (React DOM suites, isolated)',
      args: ['test', '--preload', './frameworks/react/test/Preload.js', '.dom.test.'] },
  ];
  return [{ name: `test (node --test over every suite under scripts/, ${testFiles.length} found)`,
            args: ['--test', ...testFiles] }];
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
    else if (isSuite(entry.name)) found.push(full);
  }
  return found;
}

function main() {
  let selection;
  try {
    selection = parseCheckArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  let gates;
  try {
    gates = gatesFor(selection.domains);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const results = gates.map(({ name, file }) => runStep(name, [join(checkRoot, file)]));

  if (selection.tests) {
    const isBun = Boolean(process.versions.bun);
    const testFiles = testFilesUnder(join(repoRoot, 'scripts')).sort();
    for (const { name, args } of testStep({ isBun, testFiles })) results.push(runStep(name, args));
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log(summarize(results));

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
