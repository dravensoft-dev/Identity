import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { families, CHECKSUMS, checksumsOf, checksumProblems } from '../../generate/core/fetch-fonts.mjs';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';

export function facesIn(css) {
  const faces = new Set();
  const re = /@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const fam = /font-family:\s*['"]([^'"]+)['"]/.exec(m[1]);
    if (fam) faces.add(fam[1]);
  }
  return faces;
}

export function checkFonts(declared, faces) {
  return declared
    .filter((fam) => !faces.has(fam))
    .map((fam) => `"${fam}" is declared in contracts/design/typography.json but contracts/design-generated/fonts.generated.css has no @font-face for it — run bun scripts/generate/core/fetch-fonts.mjs`);
}

function main() {
  const declared = families(root).map((f) => f.css);
  const css = readFileSync(join(root, 'contracts', 'design-generated', 'fonts.generated.css'), 'utf8');
  const errs = checkFonts(declared, facesIn(css));

  const present = readdirSync(join(root, 'assets', 'fonts')).filter((f) => f.endsWith('.woff2'));
  if (present.length === 0) {
    errs.push('found 0 .woff2 under assets/fonts -- an empty result set is a failure, not a clean pass; check the discovery path');
  } else {
    const recorded = JSON.parse(readFileSync(join(root, CHECKSUMS), 'utf8'));
    errs.push(...checksumProblems(recorded, checksumsOf(root, present)));
  }

  if (errs.length) {
    console.error(`check-fonts-generated: ${errs.length} problem(s)\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  const distinct = new Set(Object.values(checksumsOf(root, present))).size;
  console.log(
    `check-fonts-generated: ${declared.length} famil${declared.length === 1 ? 'y' : 'ies'} declared, every one has a face in `
    + `contracts/design-generated/fonts.generated.css; ${present.length} binar${present.length === 1 ? 'y' : 'ies'} match their recorded `
    + `sha256 (${distinct} distinct file${distinct === 1 ? '' : 's'} -- the families are variable fonts, so one file serves every weight)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
