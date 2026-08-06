/* ArenaUnauthCard predates ArenaCard, and its `panel` slot types out by hand the same surface ArenaCard's `root`
 * draws -- background, border width, border colour, radius, overflow. Nothing compares one
 * manifest to another, so a change to ArenaCard's radius or border colour would move ArenaCard alone and
 * leave ArenaUnauthCard on whatever it had, silently, until somebody noticed by eye. Sharing one
 * recipe was rejected on its own terms: ArenaUnauthCard's padding split (panel p-5 holding a body p-4)
 * is not ArenaCard's single body p-5, so `panel` is not a clean substitution for `root`. What was
 * never rejected is checking that the surface halves agree, which is this. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import type { ManifestClassSource } from '../../lib/tailwind/manifest-shapes.ts';

const MANIFESTS = join(root, 'frameworks/tailwind/components');

export const SURFACE = ['bg-', 'border-', 'rounded-'];

export const PAIRS = [
  {
    name: 'ArenaUnauthCard.panel mirrors ArenaCard.root',
    a: { file: 'display/arena-unauth-card/ArenaUnauthCard.manifest.json', slot: 'panel' },
    b: { file: 'display/arena-card/ArenaCard.manifest.json', slot: 'root', variant: ['accent', 'false'] },
    reason: 'ArenaUnauthCard composes the same bordered surface ArenaCard draws, by hand. The two padding '
      + 'scales differ on purpose and are not compared; the surface is.',
  },
];

export function surfaceClasses(classes: string) {
  return classes
    .split(/\s+/)
    .filter((c) => c && SURFACE.some((prefix) => c.startsWith(prefix)))
    .sort();
}

export function slotClasses(manifest: ManifestClassSource, slot: string, variant?) {
  const base = manifest.slots?.[slot] ?? '';
  if (!variant) return base;
  const [axis, value] = variant;
  const extra = manifest.variants?.[axis]?.[value]?.[slot] ?? '';
  return `${base} ${extra}`.trim();
}

export function parityProblems(pairs, read) {
  const problems = [];
  for (const { name, a, b, reason } of pairs) {
    const left = surfaceClasses(slotClasses(read(a.file), a.slot, a.variant));
    const right = surfaceClasses(slotClasses(read(b.file), b.slot, b.variant));
    if (left.length === 0 || right.length === 0) {
      problems.push(`${name}: one side declares no surface class at all, so this pair compared nothing`);
      continue;
    }
    if (left.join(' ') === right.join(' ')) continue;
    const onlyLeft = left.filter((c) => !right.includes(c));
    const onlyRight = right.filter((c) => !left.includes(c));
    problems.push(
      `${name}: the two surfaces have drifted apart.\n`
      + `    only in ${a.file} ${a.slot}: ${onlyLeft.join(' ') || '(none)'}\n`
      + `    only in ${b.file} ${b.slot}: ${onlyRight.join(' ') || '(none)'}\n`
      + `    ${reason}`,
    );
  }
  return problems;
}

function main() {
  const read = (file: string) => JSON.parse(readFileSync(join(MANIFESTS, file), 'utf8'));
  const problems = parityProblems(PAIRS, read);
  if (PAIRS.length === 0) problems.push('PAIRS is empty -- a gate with nothing to compare finds nothing by construction');

  if (problems.length) {
    console.error(`check-surface-parity: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-surface-parity: ${PAIRS.length} hand-duplicated surface(s) still agree with the manifest they mirror`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
