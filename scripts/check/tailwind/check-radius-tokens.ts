/* Fails on `rounded-full` in a Tailwind manifest, where `rounded-pill` belongs.
 * Deliberately that one class: it is the only utility in a cleared --radius-*
 * namespace that still resolves without an Arena token behind it. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { manifestFiles } from '../../lib/tailwind/tailwind-compile.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { classStringsBySlot } from '../arena/check-manifest-states.ts';
import type { ComponentManifest } from '../../lib/tailwind/manifest-shapes.ts';

const COMPONENTS_DIR = join(repoRoot, 'frameworks/tailwind/components');

export function hasRoundedFull(classString) {
  return /(?<![\w-])rounded-full(?![\w-])/.test(classString);
}

export function evaluateManifest(manifest: ComponentManifest) {
  const findings = [];
  for (const [slot, classList] of classStringsBySlot(manifest))
    if (classList.some(hasRoundedFull))
      findings.push({ component: manifest.component, slot });
  return findings;
}

export function zeroManifestProblem(files: string[]) {
  return files.length === 0
    ? 'found 0 manifests -- an empty result set is a failure, not a clean pass; check the discovery path'
    : null;
}

export function collect(files = manifestFiles(COMPONENTS_DIR)) {
  const findings = [];
  for (const p of files) {
    const manifest = JSON.parse(readFileSync(p, 'utf8'));
    findings.push(...evaluateManifest(manifest));
  }
  return findings;
}

function main() {
  const files = manifestFiles(COMPONENTS_DIR);
  const zero = zeroManifestProblem(files);
  if (zero) {
    console.error(`check-radius-tokens: ${zero}`);
    process.exit(1);
  }
  const findings = collect(files);
  if (findings.length) {
    console.error(`check-radius-tokens: ${findings.length} rounded-full usage(s) -- derives from no Arena token\n`);
    for (const f of findings) console.error(`  ${f.component}:${f.slot} carries rounded-full -- use rounded-pill (--r-pill) instead`);
    process.exit(1);
  }
  console.log(`check-radius-tokens: 0 rounded-full usage(s) -- every radius traces to an Arena token`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
