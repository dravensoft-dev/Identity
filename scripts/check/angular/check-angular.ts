import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { childOutput } from '../../lib/arena/child-output.ts';

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

export const LAYER = 'frameworks/angular';

export const node = {
  name: 'check:angular',
  reads: [
    `${LAYER}/**/*.ts`, `${LAYER}/**/*.html`, `${LAYER}/tsconfig*.json`,
    '!frameworks/angular/build/**', 'package.json', 'bun.lock',
  ],
  writes: [],
  feeds: [],
};

export function typecheck(opts: { root?: string; project?: string } = {}) {
  const root = opts.root ?? repoRoot;
  const bin = ngcBin(root);
  const first = PROJECTS[0];
  if (!first) throw new Error('check-angular: PROJECTS is empty, so this gate would compile nothing');
  const project = join(root, opts.project ?? first.project);
  const out = mkdtempSync(join(tmpdir(), 'arena-ngc-'));
  try {
    const r = childOutput(process.execPath, [bin, '-p', project, '--outDir', out]);
    if (r.error) throw new Error(`ngc failed to spawn: ${r.error.message || r.error}`);
    return { status: r.status, output: r.output };
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
      console.error(`check-angular: ${(err as Error).message}`);
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

if (isMainModule(import.meta.url)) main();
