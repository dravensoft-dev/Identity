import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import {
  buildTailwind, buildManifestModules, buildComponentCss, buildClassModules,
  buildStylesRuntime, generatedPath, BANNER,
} from '../../build/tailwind/build-tailwind.ts';
import { repoRoot } from '../../lib/arena/repo-root.mjs';

export { BANNER, generatedPath };

export function drift(opts = {}) {
  const path = generatedPath(opts);
  let committed;
  try {
    committed = readFileSync(path, 'utf8');
  } catch {
    return relative(repoRoot, path);
  }
  if (committed !== buildTailwind(opts)) return relative(repoRoot, path);

  const emitted = [
    ...buildManifestModules(opts), ...buildComponentCss(opts),
    ...buildClassModules(opts), ...buildStylesRuntime(opts),
  ];
  for (const [filePath, content] of emitted) {
    let committedFile;
    try {
      committedFile = readFileSync(filePath, 'utf8');
    } catch {
      return relative(repoRoot, filePath);
    }
    if (committedFile !== content) return relative(repoRoot, filePath);
  }
  return null;
}

function main() {
  const stale = drift();
  if (stale) {
    console.error(
      `check-tailwind-generated: ${stale} is missing or stale — run \`bun run build:tailwind\`;`
      + ' every output of that build is git-ignored, so there is nothing to commit',
    );
    process.exit(1);
  }
  console.log('check-tailwind-generated: the compiled sheet, every component stylesheet, the prelude, '
    + 'the barrel, every class module and the composer all match a fresh build of the preset and the manifests');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
