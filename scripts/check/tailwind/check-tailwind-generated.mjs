import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { buildTailwind, buildManifestModules, generatedPath, BANNER } from '../../build/tailwind/build-tailwind.mjs';
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

  for (const [tsPath, content] of buildManifestModules(opts)) {
    let committedTs;
    try {
      committedTs = readFileSync(tsPath, 'utf8');
    } catch {
      return relative(repoRoot, tsPath);
    }
    if (committedTs !== content) return relative(repoRoot, tsPath);
  }
  return null;
}

function main() {
  const stale = drift();
  if (stale) {
    const tracked = stale.endsWith('.manifest.generated.ts');
    console.error(
      `check-tailwind-generated: ${stale} is missing or stale — run \`bun run build:tailwind\``
      + (tracked ? ' and commit the result' : '; it is git-ignored, so nothing to commit'),
    );
    process.exit(1);
  }
  console.log('check-tailwind-generated: Utilities.generated.css and every manifest.generated.ts match the preset and the manifests');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
