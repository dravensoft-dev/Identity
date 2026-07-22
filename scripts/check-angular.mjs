/* Typechecks the Angular layer, templates included.
 *
 * React's specimens work because their JSX is compiled ahead of time
 * (build-demos.mjs, checked by check-demos-generated.mjs) into plain
 * `<script type="module">` output. Angular cannot ship the analogue of that
 * — decorators and templates need real compilation, not a JSX-shaped
 * transpile — so the layer's only proof that it is valid is this gate.
 * It is what stops an Angular primitive shipping in the state `tag` shipped in:
 * written, plausible, never once compiled.
 *
 * `ngc` rather than an ng-packagr build: the question here is "does every
 * template reference something that exists, under strictTemplates", which is
 * the template typechecker's, and packaging brings config and output that
 * answer a different question (plan 6's). Emission goes to a temp dir and is
 * deleted — nothing is written into the repository.
 *
 * Spawned as `process.execPath <bin>` for the same reason the Tailwind gate is:
 * identical behaviour under bun and node, no shell, no package runner.
 *
 *   bun scripts/check-angular.mjs      -> exit 0 if the layer typechecks, 1 otherwise
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

// A compile that emits more diagnostics than spawnSync's default 1 MB buffer
// sets r.error (ENOBUFS) instead of returning them, which reads as "ngc
// failed to spawn" — a misleading message for "too many errors to print".
const MAX_BUFFER = 32 * 1024 * 1024;

/** Compile frameworks/angular with ngc under strictTemplates.
 *  @param {{root?: string}} [opts]
 *  @returns {{status: number, output: string}} */
export function typecheck(opts = {}) {
  const root = opts.root ?? repoRoot;
  const bin = join(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');
  if (!existsSync(bin))
    throw new Error(`@angular/compiler-cli is not installed at ${bin} — run \`bun install\` before check:angular`);
  const project = join(root, 'frameworks/angular/tsconfig.check.json');
  const out = mkdtempSync(join(tmpdir(), 'arena-ngc-'));
  try {
    const r = spawnSync(process.execPath, [bin, '-p', project, '--outDir', out], { encoding: 'utf8', maxBuffer: MAX_BUFFER });
    if (r.error) throw new Error(`ngc failed to spawn: ${r.error.message || r.error}`);
    return { status: r.status ?? 1, output: `${r.stdout || ''}${r.stderr || ''}` };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

function main() {
  let result;
  try {
    result = typecheck();
  } catch (err) {
    console.error(`check-angular: ${err.message}`);
    process.exit(1);
  }
  const { status, output } = result;
  if (status !== 0) {
    console.error('check-angular: the Angular layer does not typecheck\n');
    console.error(output.trim());
    process.exit(1);
  }
  console.log('check-angular: the layer typechecks under strictTemplates');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
