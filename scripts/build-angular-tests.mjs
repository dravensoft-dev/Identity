/** Emit frameworks/angular's test surface with ngc.
 *
 *  This is a BUILD, not a gate, and the distinction is the point of the batch it
 *  arrived in. `check:angular` compiles `./index.ts` -- the shipped surface -- and
 *  says whether the layer typechecks. This compiles the test surface and produces
 *  the JavaScript the suites actually run, so a type error here does not merely
 *  fail an assertion somewhere: the tests cannot run at all. That is why no gate
 *  was added for the test directory and why GATES did not move.
 *
 *  It also makes the templates real. Under `@angular/compiler`'s JIT a signal input
 *  cannot be driven through a template binding, which is what forced this
 *  directory's bypass convention and left fourteen inline templates that were not
 *  valid Angular. Compiled by ngtsc they are, and strictTemplates covers them. */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ngcBin } from './check-angular.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'frameworks/angular/tsconfig.test.json';

function main() {
  let bin;
  try {
    bin = ngcBin(repoRoot);
  } catch (err) {
    console.error(`build-angular-tests: ${err.message}`);
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [bin, '-p', join(repoRoot, PROJECT)], { stdio: 'inherit', cwd: repoRoot });
  if (r.error) {
    console.error(`build-angular-tests: ngc failed to spawn: ${r.error.message || r.error}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error('\nbuild-angular-tests: the Angular test surface does not compile, so its suites cannot run');
    process.exit(r.status ?? 1);
  }
  console.log('build-angular-tests: the Angular test surface compiled to build/angular-test');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
