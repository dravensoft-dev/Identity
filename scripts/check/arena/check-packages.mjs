/* Two claims. First, that the CLI shipped inside both packages emits what Style Dictionary
 * emits: a second emitter exists, so something has to hold the two together, and without
 * this the sentence "the package emits what Arena emits" is only a sentence. Second, when
 * dist/ has been assembled, that each package is registry-standard: the version comes from
 * plugin.json, every exports target resolves to a file that is there, and no peer leaked
 * into dependencies. dist/ is git-ignored, so the second half is skipped on a fresh clone
 * and says so; the first half runs anywhere. */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { repoRoot as root } from '../../lib/arena/repo-root.mjs';
import { parseDecls } from '../../lib/arena/css-decls.mjs';
import { arenaConfig } from '../../lib/core/arena-config.mjs';
import { themeCss } from '../../generate/core/arena-theme/theme-css.mjs';

export const PACKAGES = [
  { layer: 'react', name: '@dravensoft/arena-react' },
  { layer: 'angular', name: '@dravensoft/arena-angular' },
];

export const GENERATED_PALETTE = 'contracts/design-generated/palette.generated.css';

export const distDir = (layer, base = root) => join(base, 'frameworks', layer, 'dist');

const isColour = (name) => name.startsWith('color-');

export function stripAtStatements(css) {
  return css.replace(/^\s*@[a-z-]+[^;{}]*;\s*$/gim, '');
}

export function paletteEquivalenceProblems(generatedCss, cliCss) {
  const expected = parseDecls(stripAtStatements(generatedCss));
  const actual = parseDecls(stripAtStatements(cliCss));
  const problems = [];
  let compared = 0;

  for (const [selector, decls] of expected) {
    const mine = actual.get(selector);
    if (!mine) {
      problems.push(`${GENERATED_PALETTE} declares ${selector} and arena-theme emits no such block`);
      continue;
    }
    for (const [name, value] of decls) {
      if (!isColour(name)) continue;
      compared += 1;
      if (mine.get(name) !== value) {
        problems.push(`${selector} --${name}: Style Dictionary says ${value}, arena-theme says ${mine.get(name) ?? '(nothing)'}`);
      }
    }
    for (const name of mine.keys()) {
      if (isColour(name) && !decls.has(name)) problems.push(`${selector} --${name}: arena-theme emits it and Style Dictionary does not`);
    }
  }

  if (compared === 0) {
    problems.push(`compared 0 declarations against ${GENERATED_PALETTE}; a zero-result comparison is a failure, not a pass`);
  }
  return { problems, compared };
}

export function manifestProblems(pkg, manifest, version) {
  const problems = [];
  const at = pkg.name;

  if (manifest.name !== pkg.name) problems.push(`${at}: manifest names itself ${manifest.name}`);
  if (manifest.version !== version) {
    problems.push(`${at}: version ${manifest.version}, and .claude-plugin/plugin.json says ${version}`);
  }
  if (manifest.private) problems.push(`${at}: private, so it can never be published`);
  if (manifest.scripts?.postinstall || manifest.scripts?.install || manifest.scripts?.preinstall) {
    problems.push(`${at}: declares an install script, which Bun and npm run differently and consumers disable`);
  }

  for (const name of Object.keys(manifest.dependencies ?? {})) {
    if (Object.hasOwn(manifest.peerDependencies ?? {}, name)) {
      problems.push(`${at}: ${name} is both a dependency and a peer`);
    }
    if (name.startsWith('@dravensoft/')) problems.push(`${at}: ${name} is a dependency; an Arena package is always a peer`);
    if (name === '@phosphor-icons/web') problems.push(`${at}: Phosphor is the consumer's to install, never a dependency`);
  }
  if (!Object.hasOwn(manifest.peerDependencies ?? {}, '@phosphor-icons/web')) {
    problems.push(`${at}: no peer on @phosphor-icons/web, and every component renders ph-* classes`);
  }
  return problems;
}

function exportTargets(exports) {
  const out = [];
  const walk = (value) => {
    if (typeof value === 'string') { out.push(value); return; }
    if (value && typeof value === 'object') for (const v of Object.values(value)) walk(v);
  };
  walk(exports);
  return out;
}

export function exportProblems(pkg, manifest, dir) {
  const problems = [];
  const targets = exportTargets(manifest.exports ?? {});
  if (targets.length === 0) problems.push(`${pkg.name}: no exports target resolves to a file, so the package exposes nothing`);
  for (const target of targets.filter((t) => !t.includes('*'))) {
    if (!existsSync(join(dir, target))) problems.push(`${pkg.name}: exports ${target}, which was never emitted`);
  }
  for (const [field, value] of Object.entries(manifest.bin ?? {})) {
    if (!existsSync(join(dir, value))) problems.push(`${pkg.name}: bin ${field} points at ${value}, which was never emitted`);
  }
  if (!existsSync(join(dir, 'README.md'))) problems.push(`${pkg.name}: no README.md, which is the page npm shows`);
  return problems;
}

export function collect(base = root) {
  const version = JSON.parse(readFileSync(join(base, '.claude-plugin/plugin.json'), 'utf8')).version;
  const problems = [];

  const cli = themeCss(arenaConfig(base), { importHeader: false });
  const generated = readFileSync(join(base, GENERATED_PALETTE), 'utf8');
  const equivalence = paletteEquivalenceProblems(generated, cli);
  problems.push(...equivalence.problems);

  const assembled = [];
  for (const pkg of PACKAGES) {
    const dir = distDir(pkg.layer, base);
    const manifestPath = join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    assembled.push(pkg.name);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    problems.push(...manifestProblems(pkg, manifest, version));
    problems.push(...exportProblems(pkg, manifest, dir));
  }

  return { problems, compared: equivalence.compared, assembled, version };
}

function main() {
  const { problems, compared, assembled, version } = collect();
  for (const problem of problems) console.error(`check-packages: ${problem}`);

  if (problems.length) {
    console.error(`\ncheck-packages: ${problems.length} problem(s)`);
    process.exit(1);
  }

  const built = assembled.length
    ? `${assembled.length} package(s) assembled at ${version}: ${assembled.join(', ')}`
    : 'no package assembled; run bun run build:packages to check the manifests too';
  console.log(`check-packages: arena-theme matches ${GENERATED_PALETTE} across ${compared} declaration(s); ${built}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
