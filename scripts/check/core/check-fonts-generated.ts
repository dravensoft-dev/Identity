/* Two claims about the same contract. That every family typography.json declares has a
 * self-hosted face and a binary matching its record, and that the URL the example config
 * points a consumer at is one Google answers. The second needs the network, so a status
 * that is not 200 fails and a request that never completes prints a skip: conflating the
 * two turns an outage into a pass, which is the one outcome a gate must never produce. */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { families, FONTS, recordProblems, UA } from '../../generate/core/fetch-fonts.ts';
import { arenaConfig } from '../../lib/core/arena-config.ts';
import { repoRoot as root } from '../../lib/arena/repo-root.ts';
import { captured } from '../../lib/arena/captures.ts';

export function facesIn(css: string) {
  const faces = new Set<string>();
  const re = /@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const fam = /font-family:\s*['"]([^'"]+)['"]/.exec(captured(m));
    if (fam) faces.add(captured(fam));
  }
  return faces;
}

export function checkFonts(declared: string[], faces: Set<string>) {
  return declared
    .filter((fam) => !faces.has(fam))
    .map((fam) => `"${fam}" is declared in contracts/design/typography.json but contracts/design-generated/fonts.generated.css has no @font-face for it — run bun scripts/generate/core/fetch-fonts.ts`);
}

export async function askGoogle(
  fonts: Record<string, { family: string; src: string }>,
  get: (url: string, init?: { headers: Record<string, string> }) => Promise<{ status: number }> = fetch,
) {
  const answers: { role: string; family: string; src: string; status?: number; unreachable?: string }[] = [];
  const declared = Object.entries(fonts) as [string, { family: string; src: string }][];
  for (const [role, { family, src }] of declared) {
    try {
      answers.push({ role, family, src, status: (await get(src, { headers: { 'User-Agent': UA } })).status });
    } catch (cause) {
      answers.push({ role, family, src, unreachable: String((cause as Error)?.message ?? cause) });
    }
  }
  return answers;
}

export function urlProblems(answers: Awaited<ReturnType<typeof askGoogle>>) {
  if (answers.length === 0) {
    return ['asked about 0 font URLs, and an empty result set is a failure, not a clean pass; check the discovery path'];
  }
  return answers
    .filter((a) => a.unreachable === undefined && a.status !== 200)
    .map((a) => `fonts.${a.role} points at ${a.src}, which Google answers ${a.status}. A weight query is `
      + "clamped only when it is a list: a min..max range outside the family's own axis is refused, and "
      + "Angular inlines this stylesheet during a production build, so the consumer's build fails here.");
}

async function main() {
  const declared = families(root).map((f) => f.css);
  const css = readFileSync(join(root, 'contracts', 'design-generated', 'fonts.generated.css'), 'utf8');
  const errs = checkFonts(declared, facesIn(css));

  const present = readdirSync(join(root, 'assets', 'fonts')).filter((f) => f.endsWith('.woff2'));
  if (present.length === 0) {
    errs.push('found 0 .woff2 under assets/fonts -- an empty result set is a failure, not a clean pass; check the discovery path');
  } else {
    const recorded = JSON.parse(readFileSync(join(root, FONTS), 'utf8'));
    const hashOf = (file: string) => createHash('sha256').update(readFileSync(join(root, 'assets', 'fonts', file))).digest('hex');
    errs.push(...recordProblems(recorded, present, hashOf));
  }

  const answers = await askGoogle(arenaConfig(root).fonts);
  errs.push(...urlProblems(answers));
  const unreachable = answers.filter((a) => a.unreachable !== undefined);

  if (errs.length) {
    console.error(`check-fonts-generated: ${errs.length} problem(s)\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  for (const { role, unreachable: why } of unreachable) {
    console.log(`check-fonts-generated: skipped fonts.${role}, whose request never completed (${why})`);
  }
  const answered = answers.length - unreachable.length;
  console.log(
    `check-fonts-generated: ${declared.length} famil${declared.length === 1 ? 'y' : 'ies'} declared, every one has a face in `
    + `contracts/design-generated/fonts.generated.css; ${present.length} variable binar${present.length === 1 ? 'y' : 'ies'} match `
    + 'their recorded sha256 and weight range -- one file per family, because each covers its whole range; '
    + `${answered} of ${answers.length} example-config font URL(s) answered 200`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
