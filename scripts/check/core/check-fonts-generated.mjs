import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { families } from '../../generate/core/fetch-fonts.mjs';
import { repoRoot as root } from '../../lib/repo-root.mjs';

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
    .map((fam) => `"${fam}" is declared in contracts/design/typography.json but contracts/design-generated/fonts.css has no @font-face for it — run bun scripts/generate/core/fetch-fonts.mjs`);
}

function main() {
  const declared = families(root).map((f) => f.css);
  const css = readFileSync(join(root, 'contracts', 'design-generated', 'fonts.css'), 'utf8');
  const errs = checkFonts(declared, facesIn(css));

  if (errs.length) {
    console.error(`check-fonts-generated: ${errs.length} declared famil${errs.length === 1 ? 'y' : 'ies'} with no @font-face\n`);
    for (const e of errs) console.error(`  ${e}`);
    process.exit(1);
  }
  console.log(`check-fonts-generated: ${declared.length} famil${declared.length === 1 ? 'y' : 'ies'} declared, every one has a face in contracts/design-generated/fonts.css`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
