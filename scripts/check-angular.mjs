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

export const PROJECTS = [
  { project: 'frameworks/angular/tsconfig.check.json', reaches: 'the layer, through its barrels' },
  { project: 'frameworks/angular/tsconfig.demo.json', reaches: 'the demo page entries, which no barrel reaches' },
];

export function typecheck(opts = {}) {
  const root = opts.root ?? repoRoot;
  const bin = ngcBin(root);
  const project = join(root, opts.project ?? PROJECTS[0].project);
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
  for (const { project, reaches } of PROJECTS) {
    let result;
    try {
      result = typecheck({ project });
    } catch (err) {
      console.error(`check-angular: ${err.message}`);
      process.exit(1);
    }
    const { status, output } = result;
    if (status !== 0) {
      console.error(`check-angular: ${project} does not typecheck — it reaches ${reaches}\n`);
      console.error(output.trim());
      process.exit(1);
    }
  }
  console.log(`check-angular: ${PROJECTS.length} project(s) typecheck under strictTemplates`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
