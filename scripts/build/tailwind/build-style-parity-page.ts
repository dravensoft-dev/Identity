/* The page check:style-parity drives a browser over: every case a manifest declares, painted twice
 * in one document, once by the emitted per-component sheet and once by the manifest's own class
 * string. It is a build step and not part of that gate because a gate judges and does not emit: a
 * gate that writes is an artifact another gate can read, which makes one gate's failure able to
 * stop another's, and a sweep has to report every problem in one pass. */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from '../../utils/main-module.ts';
import { repoRoot } from '../../lib/arena/repo-root.ts';
import { layerManifests } from '../../lib/tailwind/tailwind-compile.ts';
import { cases, parityPage } from '../../lib/tailwind/style-parity.ts';
import { sheetPath, CONSUME, MANIFESTS } from './build-tailwind.ts';

export const PAGE = 'frameworks/tailwind/StyleParity.generated.html';

export const node = {
  name: 'build:style-parity-page',
  reads: [MANIFESTS, `${CONSUME}/**/*.css`, 'frameworks/tailwind/Utilities.generated.css'],
  writes: [PAGE],
  feeds: [
    'check:arbitrary',
    'check:dimensions',
    'check:generated',
    'check:icons',
    'check:layer-independence',
    'check:style-parity',
  ],
};

export function sheetsFor(manifests: Map<string, unknown>) {
  return [
    '/intro/styles.css',
    '/frameworks/tailwind/Utilities.generated.css',
    ...[...manifests.keys()].map((file) => `/${sheetPath(file)}`),
  ];
}

export function allCases(manifests: Map<string, any>) {
  return [...manifests.values()].flatMap((manifest) => cases(manifest));
}

export function buildPage(manifests: Map<string, any>) {
  return parityPage(sheetsFor(manifests), allCases(manifests));
}

export function zeroCaseProblems(count: number) {
  if (count > 0) return [];
  return ['the manifests declare 0 cases, and a page comparing nothing would pass every run'];
}

function main() {
  const manifests = layerManifests(repoRoot);
  const problems = zeroCaseProblems(allCases(manifests).length);
  if (problems.length > 0) {
    for (const problem of problems) console.error(`build-style-parity-page: ${problem}`);
    process.exit(1);
  }
  writeFileSync(join(repoRoot, PAGE), buildPage(manifests));
  console.log(`build-style-parity-page: wrote ${PAGE}, ${allCases(manifests).length} case(s)`);
}

if (isMainModule(import.meta.url)) main();
