/* Asserts the committed frameworks/tailwind/utilities.css, and every
 * committed *.manifest.ts, are what the current preset and manifests compile
 * to. The same contract check-tokens-generated.mjs holds for tokens/*.css:
 * build output in the tree is only trustworthy while something fails when it
 * goes stale.
 *
 *   bun scripts/check-tailwind-generated.mjs   -> exit 0 if in sync, 1 otherwise
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { buildTailwind, buildManifestModules, generatedPath, BANNER } from './build-tailwind.mjs';
import { repoRoot } from './lib/tailwind-compile.mjs';

export { BANNER, generatedPath };

/** @param {{root?: string}} [opts]
 *  @returns {string|null} the repo-relative path that is stale, or null when in sync */
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
    console.error(`check-tailwind-generated: ${stale} is stale — run \`bun run build:tailwind\` and commit the result`);
    process.exit(1);
  }
  console.log('check-tailwind-generated: utilities.css and every manifest.ts match the preset and the manifests');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
