import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from './lib/tailwind-compile.mjs';

const MAX_BUFFER = 32 * 1024 * 1024;

export function ngcBin(root = repoRoot) {
  const bin = join(root, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');
  if (!existsSync(bin))
    throw new Error(`@angular/compiler-cli is not installed at ${bin} — run \`bun install\` before check:angular`);
  return bin;
}

export function typecheck(opts = {}) {
  const root = opts.root ?? repoRoot;
  const bin = ngcBin(root);
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
