/* The copy-in kit: the same modules the npm package ships, tracked so a consumer who
 * clones the tag can copy a component without a TypeScript toolchain of their own. The
 * payload is derived from the layer rather than maintained beside it, which is the whole
 * reason it exists as a build target instead of as a second copy of every component. */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot } from '../../lib/arena/repo-root.mjs';
import { reset, report } from '../../lib/arena/package-assembly.mjs';
import { assembleModules } from './build-react-package.mjs';

export const KIT = 'frameworks/react/kit';

export function buildKit(root = repoRoot) {
  const dir = join(root, KIT);
  reset(dir);
  const { written, compiled, declarations } = assembleModules(root, dir, { infix: '.generated' });
  return { dir, written, compiled, declarations };
}

function main() {
  if (!process.versions.bun) {
    console.error('build-kit: Bun.Transpiler is Bun-only, and this is not running under Bun');
    process.exit(2);
  }
  const { dir, written, compiled, declarations } = buildKit();
  console.log(report('build-kit', dir, written));
  console.log(`build-kit: ${compiled.length} module(s) compiled, ${declarations.length} declaration(s) emitted`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
